const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
    checkUpdate: false
});

// Configuration par défaut
let config = {
    prefix: '!',
    afkCooldown: new Map(),
    antiGroup: false,
    antiRaid: {
        enabled: false,
        spamThreshold: 5, // Nombre de messages similaires autorisés
        spamInterval: 3000, // Intervalle en ms pour détecter le spam
        joinThreshold: 5, // Nombre de joins suspects
        joinInterval: 10000, // Intervalle pour les joins suspects
        userMessages: new Map(), // Pour tracker le spam
        recentJoins: [] // Pour tracker les joins suspects
    }
};

// Charger la configuration
try {
    if (fs.existsSync('./config.json')) {
        const savedConfig = JSON.parse(fs.readFileSync('./config.json'));
        config = { ...config, ...savedConfig };
    } else {
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
    }
} catch (error) {
    console.error('Erreur de configuration:', error);
}

client.on('ready', () => {
    console.log(`${client.user.tag} est connecté!`);
    client.user.setStatus('dnd');
});

// Gestionnaire de commandes
client.on('messageCreate', async (message) => {
    if (!message?.author?.id || message.author.id !== client.user.id) return;
    if (!message.content?.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    try {
        switch (command) {
            case 'help':
                const helpText = `**📚 Liste des Commandes**
Préfixe actuel: \`${config.prefix}\`

**⚙️ Configuration**
\`${config.prefix}setprefix <prefix>\` - Change le préfixe
\`${config.prefix}help\` - Affiche l'aide

**🛡️ Protection**
\`${config.prefix}antigroup <on/off>\` - Protection contre les groupes
\`${config.prefix}raid <on/off>\` - Active la protection anti-raid
\`${config.prefix}raidconfig\` - Affiche la configuration anti-raid
\`${config.prefix}clear [nombre]\` - Supprime vos messages
\`${config.prefix}purge [nombre]\` - Supprime des messages

**👤 Status & Activité**
\`${config.prefix}status <online/idle/dnd/invisible>\` - Change le status
\`${config.prefix}streaming <texte>\` - Status streaming
\`${config.prefix}playing <texte>\` - Status playing
\`${config.prefix}watching <texte>\` - Status watching
\`${config.prefix}listening <texte>\` - Status listening
\`${config.prefix}afk\` - Mode AFK

**🎮 Utilitaires**
\`${config.prefix}ping\` - Latence
\`${config.prefix}avatar [@user]\` - Voir un avatar
\`${config.prefix}userinfo [@user]\` - Info utilisateur
\`${config.prefix}serverinfo\` - Info serveur
\`${config.prefix}snipe\` - Dernier message supprimé
\`${config.prefix}embed <titre> <description>\` - Crée un embed
\`${config.prefix}ghostping <@user>\` - Mention fantôme
\`${config.prefix}nitro\` - Codes Nitro (fun)`;

                await message.channel.send(helpText);
                break;

            case 'setprefix':
                if (!args[0]) return message.channel.send('❌ Veuillez spécifier un nouveau préfixe');
                config.prefix = args[0];
                fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
                await message.channel.send(`✅ Préfixe changé en: ${config.prefix}`);
                break;

            case 'clear':
                const amount = parseInt(args[0]) || 100;
                const messages = await message.channel.messages.fetch({ limit: 100 });
                const userMessages = messages.filter(m => m.author.id === client.user.id);
                
                for (const msg of userMessages.values()) {
                    await msg.delete().catch(() => {});
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                await message.channel.send('✅ Messages supprimés!').then(msg => {
                    setTimeout(() => msg.delete(), 3000);
                });
                break;

            case 'status':
                const status = args[0]?.toLowerCase();
                if (!['online', 'idle', 'dnd', 'invisible'].includes(status)) {
                    return message.channel.send('❌ Status invalide. Utilisez: online, idle, dnd, invisible');
                }
                await client.user.setStatus(status);
                await message.channel.send(`✅ Status changé en: ${status}`);
                break;

            case 'streaming':
                const streamingText = args.join(' ') || 'Streaming';
                await client.user.setActivity(streamingText, {
                    type: 'STREAMING',
                    url: 'https://twitch.tv/username'
                });
                await message.channel.send(`✅ Status streaming défini: ${streamingText}`);
                break;

            case 'playing':
                const gameText = args.join(' ') || 'un jeu';
                await client.user.setActivity(gameText, { type: 'PLAYING' });
                await message.channel.send(`✅ Status playing défini: ${gameText}`);
                break;

            case 'watching':
                const watchText = args.join(' ') || 'quelque chose';
                await client.user.setActivity(watchText, { type: 'WATCHING' });
                await message.channel.send(`✅ Status watching défini: ${watchText}`);
                break;

            case 'listening':
                const listenText = args.join(' ') || 'de la musique';
                await client.user.setActivity(listenText, { type: 'LISTENING' });
                await message.channel.send(`✅ Status listening défini: ${listenText}`);
                break;

            case 'antigroup':
                config.antiGroup = args[0]?.toLowerCase() === 'on';
                fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
                await message.channel.send(`✅ Anti-group ${config.antiGroup ? 'activé' : 'désactivé'}`);
                break;

            case 'raid':
                config.antiRaid.enabled = args[0]?.toLowerCase() === 'on';
                fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
                await message.channel.send(`✅ Protection anti-raid ${config.antiRaid.enabled ? 'activée' : 'désactivée'}`);
                break;

            case 'raidconfig':
                const raidConfig = `**⚙️ Configuration Anti-Raid**
• État: ${config.antiRaid.enabled ? '✅ Activé' : '❌ Désactivé'}
• Seuil de spam: ${config.antiRaid.spamThreshold} messages
• Intervalle de spam: ${config.antiRaid.spamInterval / 1000}s
• Seuil de joins: ${config.antiRaid.joinThreshold} joins
• Intervalle de joins: ${config.antiRaid.joinInterval / 1000}s`;
                await message.channel.send(raidConfig);
                break;

            case 'afk':
                client.afk = !client.afk;
                await message.channel.send(`✅ Mode AFK ${client.afk ? 'activé' : 'désactivé'}`);
                break;

            case 'ping':
                const ping = Math.round(client.ws.ping);
                await message.channel.send(`🏓 Pong! Latence: ${ping}ms`);
                break;

            case 'avatar':
                const avatarUser = message.mentions.users.first() || message.author;
                await message.channel.send(avatarUser.displayAvatarURL({ dynamic: true, size: 4096 }));
                break;

            case 'userinfo':
                const infoUser = message.mentions.users.first() || message.author;
                const member = message.guild?.members.cache.get(infoUser.id);
                const userInfo = {
                    content: `Information sur ${infoUser.tag}`,
                    embeds: [{
                        title: `Information sur ${infoUser.tag}`,
                        thumbnail: { url: infoUser.displayAvatarURL({ dynamic: true }) },
                        fields: [
                            { name: 'ID', value: infoUser.id, inline: true },
                            { name: 'Bot', value: infoUser.bot ? 'Oui' : 'Non', inline: true },
                            { name: 'Créé le', value: infoUser.createdAt.toLocaleDateString(), inline: true }
                        ],
                        color: 0x7289DA
                    }]
                };
                if (member) {
                    userInfo.embeds[0].fields.push(
                        { name: 'A rejoint le', value: member.joinedAt.toLocaleDateString(), inline: true },
                        { name: 'Rôles', value: member.roles.cache.map(r => r.name).join(', '), inline: true }
                    );
                }
                await message.channel.send(userInfo);
                break;

            case 'serverinfo':
                if (!message.guild) return message.channel.send('❌ Cette commande doit être utilisée dans un serveur');
                const guild = message.guild;
                let iconURL = guild.iconURL({ dynamic: true });
                if (!iconURL) iconURL = 'https://discord.com/assets/1f0bfc0865d324c2587920a7d80c609b.png';

                let description = '';
                description += `👑 Propriétaire: <@${guild.ownerId}>\n`;
                description += `👥 Membres: ${guild.memberCount}\n`;
                description += `💬 Salons: ${guild.channels.cache.size}\n`;
                description += `🎭 Rôles: ${guild.roles.cache.size}\n`;
                description += `📅 Créé le: ${guild.createdAt.toLocaleDateString()}\n`;
                description += `🌍 Région: ${guild.preferredLocale || 'Non définie'}\n`;
                
                await message.channel.send({
                    content: `ℹ️ Information sur ${guild.name}`,
                    embeds: [{
                        title: guild.name,
                        description: description,
                        thumbnail: { url: iconURL },
                        color: 0x7289DA,
                        footer: { text: `ID: ${guild.id}` }
                    }]
                });
                break;

            case 'snipe':
                const snipedMessage = client.snipes.get(message.channel.id);
                if (!snipedMessage) {
                    return message.channel.send('❌ Aucun message à snipe');
                }
                await message.channel.send({
                    content: `Message supprimé de ${snipedMessage.author.tag}`,
                    embeds: [{
                        description: snipedMessage.content,
                        footer: { text: 'Message supprimé' },
                        timestamp: snipedMessage.timestamp,
                        color: 0x7289DA
                    }]
                });
                break;

            case 'embed':
                const embedTitle = args[0] || 'Titre';
                const embedDesc = args.slice(1).join(' ') || 'Description';
                await message.channel.send({
                    content: '📝 Nouvel embed',
                    embeds: [{
                        title: embedTitle,
                        description: embedDesc,
                        color: Math.floor(Math.random() * 16777215),
                        timestamp: new Date()
                    }]
                });
                break;

            case 'ghostping':
                const user = message.mentions.users.first();
                if (!user) return message.channel.send('❌ Mentionnez un utilisateur');
                await message.delete();
                break;

            case 'nitro':
                const codes = [];
                for (let i = 0; i < 3; i++) {
                    codes.push('https://discord.gift/' + generateNitroCode());
                }
                await message.channel.send('🎮 Codes Nitro générés (pour le fun, non valides):\n' + codes.join('\n'));
                break;
        }
    } catch (error) {
        console.error('Erreur lors de l\'exécution de la commande:', error);
        message.channel.send('❌ Une erreur est survenue').catch(console.error);
    }
});

// Système AFK avec cooldown
client.on('messageCreate', async (message) => {
    if (!message?.channel?.type || !message?.author?.id) return;
    if (!client.afk || message.author.id === client.user.id || message.channel.type !== 'DM') return;

    const now = Date.now();
    const cooldownTime = 30000; // 30 secondes
    const lastResponse = config.afkCooldown.get(message.author.id);

    if (lastResponse && (now - lastResponse) < cooldownTime) return;
    config.afkCooldown.set(message.author.id, now);

    try {
        await message.channel.send('Je suis actuellement AFK. Je vous répondrai plus tard.');
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message AFK:', error);
    }
});

// Système anti-group
client.on('channelCreate', async (channel) => {
    try {
        if (!channel?.type) return;
        
        if (config.antiGroup && channel.type === 'GROUP_DM') {
            console.log('Tentative d\'ajout à un groupe détectée');
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (channel.delete) {
                await channel.delete().catch(console.error);
                console.log('Groupe quitté avec succès');
            } else if (channel.leave) {
                await channel.leave().catch(console.error);
                console.log('Groupe quitté avec succès');
            }
        }
    } catch (error) {
        console.error('Erreur dans l\'anti-group:', error);
    }
});

// Protection anti-raid
client.on('messageCreate', async (message) => {
    if (!message?.guild || !config.antiRaid.enabled || message.author.id === client.user.id) return;

    try {
        // Vérification du spam
        const now = Date.now();
        const userData = config.antiRaid.userMessages.get(message.author.id) || { messages: [], lastMessageTime: 0 };
        
        userData.messages = userData.messages.filter(msg => now - msg.time < config.antiRaid.spamInterval);
        userData.messages.push({ content: message.content, time: now });
        
        config.antiRaid.userMessages.set(message.author.id, userData);

        // Détection de spam
        if (userData.messages.length >= config.antiRaid.spamThreshold) {
            if (message.member.bannable) {
                await message.member.ban({ reason: 'Anti-Raid: Spam détecté' });
                console.log(`Utilisateur banni pour spam: ${message.author.tag}`);
            }
        }

        // Détection de mentions de masse
        if (message.mentions.everyone || message.mentions.users.size > 10) {
            if (message.member.bannable) {
                await message.member.ban({ reason: 'Anti-Raid: Mentions de masse' });
                console.log(`Utilisateur banni pour mentions de masse: ${message.author.tag}`);
            }
        }

        // Détection de liens malveillants
        const suspiciousLinks = /(discord\.(gift|gg)|nitro)/gi;
        if (suspiciousLinks.test(message.content)) {
            await message.delete().catch(console.error);
            if (message.member.bannable) {
                await message.member.ban({ reason: 'Anti-Raid: Liens suspects' });
                console.log(`Utilisateur banni pour liens suspects: ${message.author.tag}`);
            }
        }
    } catch (error) {
        console.error('Erreur dans l\'anti-raid:', error);
    }
});

// Protection contre les joins massifs
client.on('guildMemberAdd', member => {
    if (!config.antiRaid.enabled) return;

    const now = Date.now();
    config.antiRaid.recentJoins = config.antiRaid.recentJoins.filter(join => now - join.time < config.antiRaid.joinInterval);
    config.antiRaid.recentJoins.push({ id: member.id, time: now });

    if (config.antiRaid.recentJoins.length >= config.antiRaid.joinThreshold) {
        if (member.bannable) {
            member.ban({ reason: 'Anti-Raid: Join massif détecté' }).catch(console.error);
        }
    }
});

// Système de snipe sécurisé
client.snipes = new Map();
client.on('messageDelete', message => {
    if (!message?.content || !message?.author?.id || !message?.channel?.id) return;
    
    client.snipes.set(message.channel.id, {
        content: message.content,
        author: {
            id: message.author.id,
            tag: message.author.tag
        },
        timestamp: new Date()
    });
});

// Fonction utilitaire pour générer un code Nitro
function generateNitroCode() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 16; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

client.login(process.env.TOKEN);
