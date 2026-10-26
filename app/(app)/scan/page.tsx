'use client';
import SmartImage from '@/components/SmartImage';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTier } from '@/lib/context/TierContext';
import {
  Camera,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  XCircle,
  Circle,
  AlertTriangle,
  ArrowUp,
  GalleryVertical,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

interface ScanResult {
  goat_id: string | null;
  goat_name: string | null;
  confidence: number;
  detected: boolean;
  method: string;
  created_at: string;
}

export default function ScanPage() {
  const { tier, canUseFeature, isLoading: tierLoading } = useTier();
  const queryClient = useQueryClient();
  const mediaRef = useRef<MediaStream | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const { data: recentScans, isLoading } = useQuery({
    queryKey: ['scan-history'],
    queryFn: () => fetch('/api/app/scan').then(r => r.json()),
    enabled: !tierLoading && canUseFeature('smart-scan'),
  });

  const scanMutation = useMutation({
    mutationFn: async (imageBase64: string) => {
      const res = await fetch('/api/ml/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      return data;
    },
    onSuccess: (data) => {
      setScanResult(data);
      void queryClient.invalidateQueries({ queryKey: ['scan-history'] });
      setIsScanning(false);
    },
    onError: (err) => {
      setError(err.message || 'Scan failed');
      setIsScanning(false);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { setError('Please select an image smaller than 5 MB'); return; }
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      if (typeof base64 !== 'string') return;
      setImage(base64);
      setError(null);
      setScanResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = () => {
    if (!videoRef.current || videoRef.current.readyState < 2) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.8);

    setImage(base64);
    stopCamera();
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      mediaRef.current?.getTracks().forEach(track => track.stop());
      mediaRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      setError('Camera access denied');
    }
  };

  useEffect(() => { if (isCameraOpen && videoRef.current) videoRef.current.srcObject = mediaRef.current; }, [isCameraOpen]);
  useEffect(() => () => { mediaRef.current?.getTracks().forEach(track => track.stop()); }, []);

  const stopCamera = () => {
    mediaRef.current?.getTracks().forEach(track => track.stop());
    mediaRef.current = null;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const handleScan = () => {
    if (!image) {
      setError('Please select or capture an image first');
      return;
    }
    setIsScanning(true);
    setError(null);
    scanMutation.mutate(image);
  };

  const handleNewScan = () => {
    setImage(null);
    setScanResult(null);
    setError(null);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Smart Scan</h1>
          <p className="text-slate-500 mt-1">AI-powered goat identification</p>
        </div>
        {canUseFeature('smart-scan') && (
          <Button variant="outline" onClick={() => document.getElementById('recent-scans')?.scrollIntoView({ behavior: 'smooth' })}>
            <GalleryVertical size={20} className="mr-2" /> Gallery
          </Button>
        )}
      </div>

      {tierLoading ? <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600" role="status">Checking scan access…</p>
        : !canUseFeature('smart-scan') ? <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3"><div className="rounded-full bg-amber-100 p-2 text-amber-900"><Camera size={20} /></div><div><h2 className="font-semibold text-amber-950">Smart Scan is not included in your plan</h2><p className="mt-1 text-sm text-amber-900">You’re on the {tier} plan. Compare plans to see scan access and current limits.</p></div></div>
            <Link href="/plans" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900">Compare plans</Link>
          </CardContent>
        </Card> : <>
        {/* Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera size={20} />
              Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Preview */}
            <div className="relative aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden">
              {isCameraOpen && (
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
              )}
              {image && !isCameraOpen && (
                <SmartImage
                  src={image}
                  alt="Scan preview"
                  className="w-full h-full object-cover"
                />
              )}
              {!image && !isCameraOpen && (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <Camera size={48} className="mb-3" />
                  <p className="text-lg">No image selected</p>
                  <p className="text-sm">Upload a photo or use camera</p>
                </div>
              )}

              {/* Camera Controls */}
              {isCameraOpen && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-12 h-12 bg-white/90"
                    onClick={stopCamera}
                  >
                    <XCircle size={24} className="text-red-600" />
                  </Button>
                  <Button
                    size="icon"
                    className="w-16 h-16 bg-green-600"
                    onClick={handleCameraCapture}
                  >
                    <Circle size={32} className="text-white" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-12 h-12 bg-white/90"
                    onClick={() => { stopCamera(); setError('Select another camera through your browser camera settings.'); }}
                  >
                    <ArrowUp size={24} />
                  </Button>
                </div>
              )}

              {/* Scan Result Overlay */}
              {scanResult && !isScanning && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 animate-scale-in">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Scan Result</h3>
                      <Button variant="ghost" size="icon" onClick={handleNewScan}>
                        <XCircle size={20} />
                      </Button>
                    </div>

                    {scanResult.detected && scanResult.goat_name ? (
                      <div className="text-center">
                        <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-3" />
                        <h4 className="text-2xl font-bold text-slate-900 mb-1">{scanResult.goat_name}</h4>
                        <p className="text-slate-500 mb-4">Confidence: {Math.round(scanResult.confidence * 100)}%</p>
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getConfidenceColor(scanResult.confidence)}`}>
                          <span className="font-medium">
                            {scanResult.confidence >= 0.8 ? 'High' : scanResult.confidence >= 0.6 ? 'Medium' : 'Low'} Confidence
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-4">Method: {scanResult.method}</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <XCircle className="mx-auto h-16 w-16 text-red-600 mb-3" />
                        <h4 className="text-xl font-bold text-slate-900 mb-2">No Match Found</h4>
                        <p className="text-slate-500 mb-4">This goat is not in your herd or the image quality is too low.</p>
                        <Button onClick={handleNewScan} className="w-full">Try Again</Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Input Controls */}
            {!image && !isCameraOpen && (
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                >
                  <ImageIcon size={20} className="mr-2" /> Upload Photo
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={startCamera}
                  disabled={isScanning}
                >
                  <Camera size={20} className="mr-2" /> Use Camera
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {image && !isCameraOpen && !scanResult && (
              <Button
                className="w-full"
                size="lg"
                onClick={handleScan}
                disabled={isScanning}
              >
                {isScanning ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Camera size={20} className="mr-2" />
                    Scan Goat
                  </>
                )}
              </Button>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                <AlertTriangle size={20} />
                <span>{error}</span>
                <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
                  Dismiss
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Scans */}
        <Card>
          <CardHeader>
            <CardTitle id="recent-scans" className="text-lg">Recent Scans</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 animate-pulse bg-gray-100 rounded" />
                ))}
              </div>
            ) : recentScans?.scans?.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No scans yet</p>
            ) : (
              <div className="space-y-2">
                {(recentScans?.scans ?? []).slice(0, 10).map((scan: ScanResult) => (
                  <div key={scan.created_at} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${scan.detected ? 'bg-green-100' : 'bg-red-100'}`}>
                        {scan.detected ? (
                          <CheckCircle size={20} className="text-green-600" />
                        ) : (
                          <XCircle size={20} className="text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {scan.goat_name || 'Unknown Goat'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {scan.detected ? `${Math.round(scan.confidence * 100)}% confidence` : 'No match'}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-slate-400">
                      {format(new Date(scan.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </>}
    </div>
  );
}
