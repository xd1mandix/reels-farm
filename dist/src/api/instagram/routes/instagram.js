"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: "GET",
            path: "/instagram/connect",
            handler: "instagram.connect",
            config: { auth: false },
        },
        {
            method: "GET",
            path: "/instagram/callback",
            handler: "instagram.callback",
            config: { auth: false },
        },
    ],
};
