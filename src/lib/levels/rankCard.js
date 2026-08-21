const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
const { xpForLevel } = require('./leveling');

// Enregistre des polices embarquées dans le projet : indispensable car beaucoup
// d'environnements de déploiement (Docker slim/alpine, etc.) n'ont AUCUNE police
// système installée. Sans ça, @napi-rs/canvas dessine les formes mais pas le texte.
GlobalFonts.registerFromPath(
    path.join(__dirname, '../assets/fonts/dejavu-sans.condensed.ttf'),
    'CardFont'
);
GlobalFonts.registerFromPath(
    path.join(__dirname, '../assets/fonts/dejavu-sans.condensed-bold.ttf'),
    'CardFont-Bold'
);

const WIDTH = 1000;
const HEIGHT = 300;

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function drawBar(ctx, x, y, w, h, progress, colorBg, colorFill) {
    roundRect(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = colorBg;
    ctx.fill();

    const clamped = Math.min(Math.max(progress, 0), 1);
    const fillWidth = clamped > 0 ? Math.max(h, w * clamped) : 0;
    if (fillWidth > 0) {
        roundRect(ctx, x, y, fillWidth, h, h / 2);
        ctx.fillStyle = colorFill;
        ctx.fill();
    }
}

// Icône bulle de dialogue (chat), dessinée dans un carré de côté `size` à partir de (x, y)
function drawChatIcon(ctx, x, y, size, color) {
    const w = size;
    const h = size * 0.75;

    ctx.fillStyle = color;
    roundRect(ctx, x, y, w, h, h * 0.3);
    ctx.fill();

    // petite pointe en bas à gauche de la bulle
    ctx.beginPath();
    ctx.moveTo(x + w * 0.18, y + h - 1);
    ctx.lineTo(x + w * 0.42, y + h - 1);
    ctx.lineTo(x + w * 0.18, y + h + h * 0.35);
    ctx.closePath();
    ctx.fill();
}

// Icône micro (vocal), dessinée dans un carré de côté `size` à partir de (x, y)
function drawMicIcon(ctx, x, y, size, color) {
    const cx = x + size / 2;
    const headW = size * 0.42;
    const headH = size * 0.58;
    const headTop = y;

    ctx.fillStyle = color;
    ctx.strokeStyle = color;

    // Tête du micro (capsule arrondie)
    roundRect(ctx, cx - headW / 2, headTop, headW, headH, headW / 2);
    ctx.fill();

    // Arc de support sous la tête
    const arcY = headTop + headH * 0.62;
    const arcR = headW * 0.95;
    ctx.lineWidth = size * 0.09;
    ctx.beginPath();
    ctx.arc(cx, arcY, arcR, Math.PI * 0.15, Math.PI * 0.85, false);
    ctx.stroke();

    // Pied vertical
    const standBottom = headTop + size * 0.92;
    ctx.beginPath();
    ctx.lineWidth = size * 0.08;
    ctx.moveTo(cx, arcY + arcR * Math.sin(Math.PI * 0.5));
    ctx.lineTo(cx, standBottom);
    ctx.stroke();

    // Base horizontale
    ctx.beginPath();
    ctx.lineWidth = size * 0.08;
    ctx.moveTo(cx - size * 0.16, standBottom);
    ctx.lineTo(cx + size * 0.16, standBottom);
    ctx.stroke();
}

function drawSection(ctx, { label, level, xp, xpNeeded, rank, x, y, width, barColor, icon }) {
    const iconSize = 24;
    const iconGap = 12;

    // Icône alignée verticalement avec le texte du label
    if (icon === 'chat') {
        drawChatIcon(ctx, x, y - iconSize * 0.78, iconSize, barColor);
    } else if (icon === 'voice') {
        drawMicIcon(ctx, x, y - iconSize * 0.78, iconSize, barColor);
    }

    const textX = x + iconSize + iconGap;

    ctx.textAlign = 'left';
    ctx.font = 'bold 22px CardFont-Bold';
    ctx.fillStyle = '#d7d9e0';
    ctx.fillText(`${label} — Niveau ${level}`, textX, y);

    ctx.font = '18px CardFont';
    ctx.textAlign = 'right';
    const rankText = rank ? `#${rank} · ` : '';
    ctx.fillStyle = '#9a9cab';
    ctx.fillText(`${rankText}${xp} / ${xpNeeded} XP`, x + width, y);
    ctx.textAlign = 'left';

    drawBar(ctx, x, y + 14, width, 22, xp / xpNeeded, '#3a3c4d', barColor);
}

async function generateRankCard({ username, avatarUrl, chat, voice, chatRank, voiceRank }) {
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    // Fond avec dégradé
    const bgGradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    bgGradient.addColorStop(0, '#1e1f29');
    bgGradient.addColorStop(1, '#2a2c3d');
    roundRect(ctx, 0, 0, WIDTH, HEIGHT, 24);
    ctx.fillStyle = bgGradient;
    ctx.fill();

    // Avatar
    const avatarSize = 200;
    const avatarX = 40;
    const avatarY = (HEIGHT - avatarSize) / 2;

    try {
        const response = await fetch(avatarUrl);
        const buffer = Buffer.from(await response.arrayBuffer());
        const avatarImg = await loadImage(buffer);

        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
    } catch (err) {
        // Si l'avatar ne charge pas, cercle gris par défaut
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#44465a';
        ctx.fill();
    }

    // Anneau autour de l'avatar
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#5865F2';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Pseudo
    const textX = avatarX + avatarSize + 40;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px CardFont-Bold';
    ctx.fillText(username, textX, 90);

    // Barre Chat
    drawSection(ctx, {
        label: 'CHAT',
        level: chat.level,
        xp: chat.xp,
        xpNeeded: xpForLevel(chat.level + 1),
        rank: chatRank,
        x: textX,
        y: 150,
        width: WIDTH - textX - 40,
        barColor: '#FFB800',
        icon: 'chat',
    });

    // Barre Vocal
    drawSection(ctx, {
        label: 'VOCAL',
        level: voice.level,
        xp: voice.xp,
        xpNeeded: xpForLevel(voice.level + 1),
        rank: voiceRank,
        x: textX,
        y: 230,
        width: WIDTH - textX - 40,
        barColor: '#00C2FF',
        icon: 'voice',
    });

    return canvas.toBuffer('image/png');
}

module.exports = { generateRankCard };