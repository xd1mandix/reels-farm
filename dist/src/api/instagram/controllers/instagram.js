"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const instagram_1 = require("../services/instagram");
exports.default = {
    async connect(ctx) {
        ctx.redirect((0, instagram_1.getInstAuthUrl)());
    },
    async callback(ctx) {
        const body = new URLSearchParams({
            client_id: process.env.META_APP_ID,
            client_secret: process.env.META_APP_SECRET,
            grant_type: "authorization_code",
            redirect_uri: process.env.META_REDIRECT_URI,
            code: ctx.query.code
        });
        const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body,
        });
        const token = await tokenRes.json();
        console.log('[got token][insta]');
        const res = await fetch("https://graph.instagram.com/access_token?" +
            new URLSearchParams({
                grant_type: "ig_exchange_token",
                client_secret: process.env.META_APP_SECRET,
                access_token: token.access_token,
            }));
        const longToken = await res.json();
        console.log('[got long token][insta]');
        const me = await fetch("https://graph.instagram.com/v23.0/me?" +
            new URLSearchParams({
                fields: "user_id,username,profile_picture_url",
                access_token: longToken.access_token,
            }));
        const profile = await me.json();
        console.log(profile.username, '[logined][insta]');
        await strapi.documents("api::account.account").create({
            data: {
                platform: "instagram",
                name: profile.username || '',
                accessToken: longToken.access_token,
                externalId: profile.user_id,
                link: `https://www.instagram.com/${profile.username}`,
                expiresAt: new Date(Date.now() + longToken.expires_in * 1000),
            },
        });
        ctx.body = "Instagram connected";
    }
};
