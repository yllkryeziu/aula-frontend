import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface VideoPlayerProps {
  subchapterId: string;
  videoStatus: string;
  videoProgress: number;
  videoFilePath: string | null;
  audioFilePath: string | null;
  videoMessage?: string | null;
  onRetry?: () => void;
  onGenerateVideo?: () => void;
  videoType?: 'explanation' | 'blackboard';
}

export const VideoPlayer = ({
  subchapterId,
  videoStatus,
  videoProgress,
  videoFilePath,
  audioFilePath,
  videoMessage,
  onRetry,
  onGenerateVideo,
  videoType = 'explanation'
}: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const { toast } = useToast();

  // Reset isRetrying when status changes away from failed
  useEffect(() => {
    if (videoStatus !== 'failed' && videoStatus !== 'FAILED' && isRetrying) {
      setIsRetrying(false);
    }
  }, [videoStatus, isRetrying]);

  // Handle retry with immediate feedback
  const handleRetryClick = async () => {
    if (onRetry) {
      setIsRetrying(true);
      try {
        await onRetry();
      } catch (error) {
        setIsRetrying(false); // Reset on error
      }
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;

    const updateTime = () => {
      const activeElement = video || audio;
      if (activeElement) {
        setCurrentTime(activeElement.currentTime);
        setDuration(activeElement.duration || 0);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleError = () => {
      setError('Failed to load media. Please try again.');
      setIsPlaying(false);
    };

    if (video) {
      video.addEventListener('timeupdate', updateTime);
      video.addEventListener('ended', handleEnded);
      video.addEventListener('error', handleError);
      video.addEventListener('loadedmetadata', updateTime);
    }

    if (audio) {
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      audio.addEventListener('loadedmetadata', updateTime);
    }

    return () => {
      if (video) {
        video.removeEventListener('timeupdate', updateTime);
        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('error', handleError);
        video.removeEventListener('loadedmetadata', updateTime);
      }
      if (audio) {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('loadedmetadata', updateTime);
      }
    };
  }, [videoFilePath, audioFilePath]);

  const togglePlayPause = async () => {
    try {
      const video = videoRef.current;
      const audio = audioRef.current;
      const activeElement = video || audio;
      
      if (!activeElement) return;

      if (isPlaying) {
        await activeElement.pause();
        setIsPlaying(false);
      } else {
        await activeElement.play();
        setIsPlaying(true);
      }
    } catch (err) {
      toast({
        title: "Playback Error",
        description: "Failed to play media. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    const video = videoRef.current;
    const audio = audioRef.current;
    const activeElement = video || audio;

    if (activeElement) {
      activeElement.volume = newVolume;
    }
  };

  const handleSeek = (seekTime: number) => {
    const video = videoRef.current;
    const audio = audioRef.current;
    const activeElement = video || audio;

    if (activeElement && duration > 0) {
      activeElement.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPosition = clickX / rect.width;
    const seekTime = clickPosition * duration;

    handleSeek(seekTime);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setPlaybackSpeed(newSpeed);
    const video = videoRef.current;
    const audio = audioRef.current;
    const activeElement = video || audio;

    if (activeElement) {
      activeElement.playbackRate = newSpeed;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Video generation in progress
  if (videoStatus === 'queued' ||
      videoStatus === 'generating_script' ||
      videoStatus === 'generating_images' ||
      videoStatus === 'generating_audio' ||
      videoStatus === 'creating_scenes' ||
      videoStatus === 'rendering_video') {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h3 className="font-medium mb-2">Generating Video Content</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {videoMessage || (
                <>
                  {videoStatus === 'queued' && "Your video is queued for generation..."}
                  {videoStatus === 'generating_script' && "AI is creating educational content..."}
                  {videoStatus === 'generating_images' && "AI is generating visual content..."}
                  {videoStatus === 'generating_audio' && "Creating voiceover with AI speech synthesis..."}
                  {videoStatus === 'creating_scenes' && "Assembling video scenes and animations..."}
                  {videoStatus === 'rendering_video' && "Creating visual animations with voiceover..."}
                </>
              )}
            </p>
            {videoProgress > 0 && (
              <div className="w-full bg-secondary rounded-full h-2 mb-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Progress: {videoProgress}% - This usually takes 3-5 minutes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Video generation failed
  if (videoStatus === 'failed') {
    return (
      <Card className="w-full border-destructive">
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
            <h3 className="font-medium mb-2 text-destructive">Video Generation Failed</h3>
            <p className="text-sm text-muted-foreground mb-4">
              There was an issue generating the video content. Please try again.
            </p>
            {onRetry && (
              <Button
                onClick={handleRetryClick}
                variant="outline"
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retry Generation
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Video not generated yet
  if (videoStatus === 'not_started' || (!videoFilePath && !audioFilePath)) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Play className="h-4 w-4" />
            </div>
            <h3 className="font-medium mb-2">No Video Available</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Video content has not been generated for this lesson yet.
            </p>
            {onGenerateVideo && (
              <Button onClick={onGenerateVideo} variant="outline">
                <Play className="h-4 w-4 mr-2" />
                Generate Video
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Video completed and ready to play
  return (
    <Card className="w-full">
      <CardContent className="p-0">
        {error ? (
          <div className="p-6 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
            <p className="text-destructive font-medium">{error}</p>
            <Button onClick={() => setError(null)} variant="outline" className="mt-2">
              Try Again
            </Button>
          </div>
        ) : (
          <>
            {/* Video Element */}
            {videoFilePath && (
              <div className="relative bg-black rounded-t-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-auto max-h-96 object-contain"
                  src={videoType === 'blackboard' ? apiClient.getBlackboardVideoUrl(subchapterId) : apiClient.getVideoUrl(subchapterId)}
                  preload="metadata"
                  onError={() => setError('Failed to load video')}
                />
                
                {/* Video Overlay Controls */}
                <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="rounded-full w-16 h-16 bg-black/50 hover:bg-black/70 text-white border-0"
                    onClick={togglePlayPause}
                  >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                  </Button>
                </div>
              </div>
            )}

            {/* Audio Element (hidden) */}
            {audioFilePath && !videoFilePath && (
              <audio
                ref={audioRef}
                src={apiClient.getAudioUrl(subchapterId)}
                preload="metadata"
                onError={() => setError('Failed to load audio')}
              />
            )}

            {/* Audio-only UI */}
            {audioFilePath && !videoFilePath && (
              <div className="p-8 text-center bg-gradient-to-br from-primary/5 to-accent/5 rounded-t-lg">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Volume2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-medium mb-2">Audio Lesson</h3>
                <p className="text-sm text-muted-foreground">
                  Listen to the AI-generated audio content
                </p>
              </div>
            )}

            {/* Media Controls */}
            <div className="p-4 border-t bg-card">
              <div className="flex items-center gap-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={togglePlayPause}
                  className="shrink-0"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>

                <div className="flex-1 text-center">
                  <div className="text-sm font-medium">
                    {duration > 0 ? `${formatTime(currentTime)} / ${formatTime(duration)}` : 'Loading...'}
                  </div>
                  {duration > 0 && (
                    <div
                      className="w-full bg-secondary rounded-full h-2 mt-1 cursor-pointer hover:bg-secondary/80 transition-colors"
                      onClick={handleProgressBarClick}
                      title="Click to seek"
                    >
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-100 relative"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      >
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Speed Control */}
                  <select
                    value={playbackSpeed}
                    onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                    className="text-xs bg-secondary border-none rounded px-2 py-1 cursor-pointer"
                    title="Playback Speed"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={0.75}>0.75x</option>
                    <option value={1}>1x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2x</option>
                  </select>

                  {/* Volume Control */}
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-16 h-1 bg-secondary rounded-full appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};