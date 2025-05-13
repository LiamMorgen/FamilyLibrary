import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Camera, X } from 'lucide-react';

interface BookInfo {
  title: string;
  authors: string[];
  publisher: string;
  publishedDate: string;
  description: string;
  isbn: string;
  imageUrl: string;
}

export default function ScanBookPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [bookInfo, setBookInfo] = useState<BookInfo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // State for camera functionality
  const [showCameraView, setShowCameraView] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraInited, setCameraInited] = useState(false);

  const processImageFile = useCallback(async (file: File) => {
    if (!file) return;

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setShowCameraView(false); // Hide camera view if open
    if (videoStream) { // Stop camera if it was used
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }

    console.log('开始处理图片, 大小:', file.size, '字节, 类型:', file.type);
    setIsLoading(true);
    setBookInfo(null); // Clear previous book info
    try {
      const formData = new FormData();
      formData.append('image', file);
      console.log('FormData已创建，包含image字段');

      // 获取JWT令牌
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('您需要登录才能使用此功能');
      }
      console.log('已获取JWT令牌，准备发送请求');

      console.log('开始发送识别请求到后端...');
      const response = await fetch('/api/books/scan', {
        method: 'POST',
        body: formData,
        headers: {
          // FormData不能设置Content-Type，让浏览器自动处理
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('请求已发送，响应状态:', response.status, response.statusText);

      if (!response.ok) {
        console.error('请求失败，状态码:', response.status);
        let errorMessage = '识别失败';
        
        try {
          const errorData = await response.json();
          console.error('错误详情:', errorData);
          errorMessage = errorData.message || '识别失败，请检查后端日志';
        } catch (jsonError) {
          console.error('无法解析错误响应为JSON:', jsonError);
          errorMessage = `请求失败，状态码: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }

      console.log('请求成功，开始解析响应...');
      const data = await response.json();
      console.log('响应数据:', data);
      
      if (!data || Object.keys(data).length === 0) {
        console.warn('响应成功但数据为空');
        toast({
            title: t('scanBook.error'),
            description: t('scanBook.noBookInfoFoundByApi'),
            variant: 'destructive',
        });
        setBookInfo(null);
      } else {
        console.log('成功获取图书信息:', data.title);
        setBookInfo(data);
        toast({
            title: t('scanBook.success'),
            description: t('scanBook.successDescription'),
        });
      }
    } catch (error: any) {
      console.error('处理图片过程出错:', error);
      toast({
        title: t('scanBook.error'),
        description: error.message || t('scanBook.errorDescription'),
        variant: 'destructive',
      });
      setBookInfo(null);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) { // Clear file input
        fileInputRef.current.value = "";
      }
    }
  }, [toast, t, videoStream]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const openCamera = useCallback(async () => {
    console.log('开始请求摄像头权限...');
    setCameraError(null);
    
    try {
      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('您的浏览器不支持摄像头功能');
      }
      
      // 尝试访问摄像头
      console.log('正在请求摄像头权限...');
      
      // 简化摄像头请求，不使用facingMode
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false 
      });
      
      console.log('摄像头权限已获取!', stream);
      console.log('视频轨道:', stream.getVideoTracks());
      
      if (stream.getVideoTracks().length === 0) {
        throw new Error('没有检测到视频轨道');
      }
      
      setVideoStream(stream);
      setShowCameraView(true);
      setCameraInited(true);
      setPreviewUrl(null);
      setBookInfo(null);
      
      console.log('状态已更新，即将显示摄像头视图');
      
      // 不在这里设置srcObject，等待useEffect处理
      
    } catch (error: any) {
      console.error('摄像头访问失败:', error);
      
      let errorMessage = '无法访问摄像头';
      
      // 更详细的错误处理
      if (error.name === 'NotAllowedError') {
        errorMessage = '摄像头权限被拒绝，请在浏览器中允许访问';
      } else if (error.name === 'NotFoundError') {
        errorMessage = '未找到可用的摄像头设备';
      } else if (error.name === 'NotReadableError') {
        errorMessage = '摄像头被其他应用程序占用';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = '摄像头不满足要求的参数';
      }
      
      setCameraError(errorMessage);
      toast({
        title: t('scanBook.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [toast, t]);

  const closeCamera = useCallback(() => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }
    setVideoStream(null);
    setShowCameraView(false);
  }, [videoStream]);

  const takePhotoAndProcess = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !videoStream) {
      console.error('视频、画布或视频流不可用');
      toast({
        title: t('scanBook.error'),
        description: '无法拍照，请确保摄像头正常工作',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // 使用实际视频尺寸
      const width = video.videoWidth;
      const height = video.videoHeight;
      
      if (!width || !height) {
        console.error('无法获取视频尺寸:', width, height);
        toast({
          title: t('scanBook.error'),
          description: '无法获取视频尺寸，请重试',
          variant: 'destructive',
        });
        return;
      }
      
      console.log('捕获图像，尺寸:', width, 'x', height);
      
      // 设置画布尺寸
      canvas.width = width;
      canvas.height = height;
      
      // 获取2D上下文
      const context = canvas.getContext('2d');
      if (!context) {
        console.error('无法获取画布上下文');
        return;
      }
      
      // 在画布上绘制当前视频帧
      context.drawImage(video, 0, 0, width, height);
      
      // 将画布内容转换为图片
      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.error('无法创建图像Blob');
          return;
        }
        
        console.log('成功创建图像Blob，大小:', blob.size, '字节');
        
        // 创建File对象
        const photoFile = new File([blob], "photo.jpg", { type: "image/jpeg" });
        await processImageFile(photoFile);
        
        // 拍照后自动关闭相机视图
        closeCamera();
      }, 'image/jpeg', 0.95); // 使用较高的图像质量
      
    } catch (error) {
      console.error('拍照过程出错:', error);
      toast({
        title: t('scanBook.error'),
        description: '拍照过程出错，请重试',
        variant: 'destructive',
      });
    }
  }, [videoStream, videoRef, canvasRef, toast, t, processImageFile, closeCamera]);

  // 视频元素加载完成后设置视频流
  useEffect(() => {
    if (videoRef.current && videoStream && showCameraView) {
      console.log('Setting video stream to video element in useEffect');
      videoRef.current.srcObject = videoStream;
      videoRef.current.onloadedmetadata = () => {
        console.log('Video metadata loaded. Playing video...');
        videoRef.current?.play().catch(e => {
          console.error('Video play error:', e);
          setCameraError('无法播放视频，可能是浏览器限制或设备不支持');
        });
      };
    }
    
    return () => {
      // 清理函数
      if (videoStream) {
        console.log('Cleanup: stopping all tracks');
        videoStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoStream, showCameraView]);

  if (showCameraView) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6">{t('scanBook.takePhoto')}</h1>
        
        {cameraError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{cameraError}</p>
          </div>
        )}
        
        <div className="relative w-full max-w-lg mb-4 bg-gray-100 rounded-lg overflow-hidden">
          {/* 明确设置所有视频属性 */}
          <video 
            ref={videoRef}
            autoPlay 
            playsInline
            muted
            className="w-full rounded-lg shadow-lg"
            style={{ display: cameraInited ? 'block' : 'none' }}
          />
          
          {!cameraInited && !cameraError && (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">正在初始化摄像头...</span>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={closeCamera}
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/75 text-white"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        <Button 
          onClick={takePhotoAndProcess} 
          className="w-full max-w-lg" 
          disabled={!videoStream || isLoading || !cameraInited}
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
          {t('scanBook.captureButton')}
        </Button>
        
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{t('scanBook.title')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">{t('scanBook.uploadImage')}</h2>
          
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="image-upload">{t('scanBook.selectImage')}</Label>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="cursor-pointer"
                disabled={isLoading}
              />
            </div>

            <Button
              onClick={openCamera}
              className="w-full"
              variant="outline"
              disabled={isLoading}
            >
              <Camera className="mr-2 h-4 w-4" />
              {t('scanBook.takePhoto')}
            </Button>

            {previewUrl && !isLoading && (
              <div className="mt-4 border rounded-lg p-2">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full max-h-72 object-contain rounded-lg"
                />
              </div>
            )}
             {previewUrl && isLoading && (
              <div className="mt-4 border rounded-lg p-2 flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">{t('scanBook.bookInfo')}</h2>
          
          {isLoading && !bookInfo && !previewUrl && ( // Initial loading state before preview or bookInfo
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          {!isLoading && !bookInfo && !previewUrl && ( // Default empty state
             <p className="text-gray-500 text-center py-8">{t('scanBook.noBookInfo')}</p>
          )}

          {/* Display loader while bookInfo is being fetched after an image is set */}
          {previewUrl && isLoading && (
            <div className="flex items-center justify-center h-48">
               {/* Loader is shown in the left card's preview area, so this can be minimal or removed */}
            </div>
          )}
          
          {bookInfo && !isLoading && (
            <div className="space-y-4">
              <div>
                <Label>{t('scanBook.bookInfoTitle')}</Label>
                <p className="font-medium">{bookInfo.title}</p>
              </div>
              <div>
                <Label>{t('scanBook.authors')}</Label>
                <p className="font-medium">{bookInfo.authors?.join(', ') || t('scanBook.unknownAuthor')}</p>
              </div>
              <div>
                <Label>{t('scanBook.publisher')}</Label>
                <p className="font-medium">{bookInfo.publisher || t('scanBook.unknownPublisher')}</p>
              </div>
              <div>
                <Label>{t('scanBook.publishedDate')}</Label>
                <p className="font-medium">{bookInfo.publishedDate || t('scanBook.unknownDate')}</p>
              </div>
              <div>
                <Label>{t('scanBook.isbn')}</Label>
                <p className="font-medium">{bookInfo.isbn || t('scanBook.unknownIsbn')}</p>
              </div>
              {bookInfo.imageUrl && (
                <div>
                  <img
                    src={bookInfo.imageUrl}
                    alt={bookInfo.title}
                    className="w-32 h-48 object-cover rounded-lg shadow-md"
                  />
                </div>
              )}
              <Button className="w-full mt-4">
                <Camera className="mr-2 h-4 w-4" /> {/* Placeholder, should be different icon like Plus or Save */}
                {t('scanBook.addToLibrary')}
              </Button>
            </div>
          )}
          {/* Case: No book info found by API after loading */}
          {!isLoading && previewUrl && !bookInfo && (
             <p className="text-gray-500 text-center py-8">{t('scanBook.noBookInfoFoundByApi')}</p>
          )}
        </Card>
      </div>
    </div>
  );
} 