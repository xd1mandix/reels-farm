"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ({ env }) => {
    return {
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
        "strapi-custom-action-perform-page": {
            enabled: true,
            config: {
                title: 'Подключение аккаунтов',
                downloadButtons: [
                    {
                        label: "Youtube",
                        buttonText: "Авторизоваться",
                        endpoints: {
                            localhost: "http://localhost:1337/api/youtube/connect",
                            production: `${env('PUBLIC_URL')}/api/youtube/connect`,
                        },
                    },
                    {
                        label: "Instagram",
                        buttonText: "Авторизоваться",
                        endpoints: {
                            localhost: "http://localhost:1337/api/instagram/connect",
                            production: `${env('PUBLIC_URL')}/api/instagram/connect`,
                        },
                    },
                ],
            },
        },
    };
};
