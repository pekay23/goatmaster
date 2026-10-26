import {expect,test} from 'bun:test';
import {allowsMutationOrigin} from '../../lib/request-origin';
const internal=new URL('http://localhost:3001/api/auth/signup');
test('accepts the browser LAN authority when Next normalizes its URL',()=>{
 expect(allowsMutationOrigin(new Headers({host:'192.168.8.202:3001',origin:'http://192.168.8.202:3001','sec-fetch-site':'same-origin'}),internal)).toBe(true);
});
test('keeps exact host, port and scheme checks',()=>{
 for(const origin of ['http://attacker.example','http://192.168.8.202:3000','https://192.168.8.202:3001','http://localhost:3001','null','http://192.168.8.202:3001/path'])expect(allowsMutationOrigin(new Headers({host:'192.168.8.202:3001',origin}),internal)).toBe(false);
});
test('rejects cross-site metadata and untrusted forwarded host',()=>{
 expect(allowsMutationOrigin(new Headers({host:'192.168.8.202:3001',origin:'http://192.168.8.202:3001','sec-fetch-site':'cross-site'}),internal)).toBe(false);
 expect(allowsMutationOrigin(new Headers({host:'192.168.8.202:3001',origin:'http://attacker.example','x-forwarded-host':'attacker.example'}),internal)).toBe(false);
});
test('preserves requests without Origin and uses URL when Host is absent',()=>{
 expect(allowsMutationOrigin(new Headers(),internal)).toBe(true);
 expect(allowsMutationOrigin(new Headers({origin:'http://localhost:3001'}),internal)).toBe(true);
});
