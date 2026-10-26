"""Run real CPU inference and projection training against isolated fixtures."""
import asyncio
import base64
import contextlib
import io
import os
from pathlib import Path
import sys
import tempfile
from unittest.mock import patch
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'ml_service'))
os.environ['ML_SERVICE_KEY'] = 'local-verification-key'
os.environ['APP_DATABASE_URL'] = ''
os.environ['YOLO_CONFIG_DIR'] = str(ROOT / '.verification' / 'yolo')
os.chdir(ROOT / '.verification')

import numpy as np
import torch
from PIL import Image
import main
import grpc_server
import reid_model
from goatmaster.ml.v1 import ml_service_pb2
from fastapi import HTTPException

torch.set_num_threads(2)
picture = Image.open(ROOT / 'public/marketing/goat-portrait.jpg').convert('RGB')
picture.thumbnail((640, 640))
buffer = io.BytesIO()
picture.save(buffer, format='JPEG')
encoded = base64.b64encode(buffer.getvalue()).decode()
organization_id = str(uuid4())

class Cursor:
    def __init__(self, rows=()):
        self.rows = rows
        self.calls = []
    def __enter__(self):
        return self
    def __exit__(self, *args):
        return False
    def execute(self, sql, params=()):
        self.calls.append((sql, params))
    def fetchone(self):
        return None
    def fetchall(self):
        return self.rows

class Connection:
    def __init__(self, rows=()):
        self.cur = Cursor(rows)
        self.committed = False
    def cursor(self):
        return self.cur
    def commit(self):
        self.committed = True

@contextlib.contextmanager
def scan_connection(*args):
    conn = Connection()
    yield conn
    sql, params = conn.cur.calls[-1]
    assert 'g.organization_id = %s' in sql
    assert params[1] == organization_id
    assert params[2] == reid_model.model_version()

async def verify():
    for supplied in (None, 'wrong-key'):
        try:
            await main.verify_key(supplied)
            raise AssertionError('Unauthenticated request was accepted')
        except HTTPException as error:
            assert error.status_code == 403
    await main.verify_key('local-verification-key')
    with patch.object(grpc_server, 'ML_SERVICE_KEY', ''):
        assert not grpc_server.verify_key([])
    assert grpc_server.verify_key([('x-ml-key', 'local-verification-key')])
    protected = [route for route in main.app.routes if getattr(route, 'path', '').startswith(('/scan', '/embed', '/enroll', '/train', '/goatmaster.'))]
    assert protected and all(route.dependencies for route in protected)
    print('PASS authentication and protected HTTP aliases')

    first = await main.embed_image(main.EmbedRequest(image_b64=encoded))
    second = await main.embed_image(main.EmbedRequest(image_b64=encoded))
    vector = np.asarray(first['embedding'])
    assert vector.shape == (128,) and np.isfinite(vector).all()
    assert np.allclose(vector, second['embedding'])
    enrolled = await main.enroll_goat(main.EnrollRequest(images=[encoded]))
    assert enrolled['count'] == 1
    print('PASS deterministic 128-dimensional inference and enrollment')

    with patch.object(main, 'get_db_connection', scan_connection):
        response = await main.scan_goat(main.ScanRequest(image_b64=encoded, user_id=uuid4(), organization_id=organization_id))
        assert response['goat'] is None and response['confidence'] == 0
    class Context:
        def invocation_metadata(self):
            return [('x-ml-key', 'local-verification-key')]
        def abort(self, code, message):
            raise AssertionError(message)
    with patch.object(grpc_server, 'get_db_connection', scan_connection):
        response = grpc_server.MlServiceServicer().Scan(ml_service_pb2.ScanRequest(image_b64=encoded, user_id=str(uuid4()), organization_id=organization_id), Context())
        assert not response.HasField('goat')
    print('PASS organization-scoped HTTP and gRPC scan queries')

    rows = [(str(uuid4()), 'animal-'+str(group), np.full(128, group + index * 0.01, dtype=np.float32)) for group in range(2) for index in range(3)]
    connection = Connection(rows)
    with tempfile.TemporaryDirectory(dir=ROOT / '.verification') as directory:
        with patch.object(reid_model, 'weights_path', Path(directory) / 'projection.pt'):
            trained = reid_model.train_projection(connection, epochs=1)
            assert trained['status'] == 'ok' and np.isfinite(trained['final_loss'])
            assert connection.committed
            updates = [params for sql, params in connection.cur.calls if sql.startswith('UPDATE goat_embeddings')]
            assert len(updates) == 6 and all(params[1] == reid_model.model_version() for params in updates)
            assert reid_model.weights_path.exists()
    print('PASS projection training, embedding migration and checkpoint creation')

asyncio.run(verify())
