export default () => ({
    'video-optimizer': {
        enabled: true,
        config: {
        defaultChoice: 'original',
        defaultFormat: 'mp4',
        videoCodec: 'h264',
        crf: 23,
        preset: 'medium',
        maxWidth: 1920,
        maxHeight: 1080,
        audioMode: 'compress',
        audioBitrate: '128k',
        maxConcurrentJobs: 1,
        maxFfmpegThreads: 2,
        },
  },
});
