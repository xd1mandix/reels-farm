"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: "GET",
            path: "/youtube/connect",
            handler: "youtube.connect",
            config: { auth: false },
        },
        {
            method: "GET",
            path: "/youtube/callback",
            handler: "youtube.callback",
            config: { auth: false },
        },
    ],
};
