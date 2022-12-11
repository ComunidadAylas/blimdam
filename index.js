const { Client, GatewayIntentBits, Events, PermissionsBitField } = require('discord.js');

/*                        *
 * Opciones configurables *
 *                        */
const comandoLimpiar = "!limpiar";
const tiempoEsperaBorrado = 180000; // En ms

const bot = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const mensajesLimpiarAuto = {};

bot.once(Events.ClientReady, () => {
    console.log('El bot está en marcha y aceptando eventos.');
    
    bot.on(Events.MessageCreate, (message) => {
        console.log('Evento de mensaje recibido.');

        function tieneBotPermiso(permiso) {
            return message.guild.members.me.permissionsIn(message.channel).has(permiso);
        }

        if (!tieneBotPermiso(PermissionsBitField.Flags.ViewChannel)) {
            // Ignorar canales a los que el bot no debería de poder hacerle caso
            return;
        }

        if (!tieneBotPermiso(PermissionsBitField.Flags.ManageMessages)) {
            // Si el bot no tiene permisos adecuados para hacer nada, avisar si es posible
            if (tieneBotPermiso(PermissionsBitField.Flags.SendMessages)) {
                message.channel.send("❌ No tengo los permisos necesarios para limpiar este canal.");
            }

            return;
        }

        if (message.content === comandoLimpiar) {
            // Procesar comando para limpiar el canal de mensajes

            // Avisar al usuario de la operación
            if (tieneBotPermiso(PermissionsBitField.Flags.SendMessages)) {
                message.channel.send("✅ Se irán borrando los mensajes no fijados poco a poco. Ejecuta este comando varias veces si no se borran todos.");
            }

            let retardoInicial = true;
            message
                .channel
                .messages
                .fetch()
                .then(messages => {
                    // Borrar todos los mensajes no fijados
                    messages.forEach(msg => {
                        if (!msg.pinned) {
                            setTimeout(() => msg.delete().catch(err => {
                                if (tieneBotPermiso(PermissionsBitField.Flags.SendMessages)) {
                                    message.channel.send("❌ Ha ocurrido un error borrando un mensaje. ¡<@85378939890962432>, investiga esto!");
                                }
                                console.log(err);
                            }), retardoInicial ? 10000 : 4000);
                            retardoInicial = false;
                        }
                    });
                })
                .catch(err => {
                    if (tieneBotPermiso(PermissionsBitField.Flags.SendMessages)) {
                        message.channel.send("❌ Ha ocurrido un error al obtener los mensajes del canal. ¡<@85378939890962432>, haz algo!");
                    }
                    console.log(err);
                });
        } else {
            // Mensaje normal (comando, etc.) en canal que controla este bot, borrar tras un tiempo
            mensajesLimpiarAuto[message.id] = setTimeout(() => {
                // Usamos message.delete() en vez de channel.bulkDelete() porque parece tener un funcionamiento más estable
                message.delete();
                mensajesLimpiarAuto[message.id] = undefined;
            }, tiempoEsperaBorrado);
        }
    });

    bot.on(Events.ChannelPinsUpdate, (channel) => {
        console.log('Evento de mensajes fijados actualizados recibido.');

        if (channel.guild.members.me.permissionsIn(channel).has(PermissionsBitField.Flags.ViewChannel)) {
            // Obtener mensajes fijados debería de ser más eficiente que mensajes enviados para Aylas
            channel
                .messages
                .fetchPinned()
                .then(messages => {
                    messages.forEach(msg => {
                        // Borrar este mensaje del mapa de mensajes candidatos de borrar
                        if (mensajesLimpiarAuto[msg.id]) {
                            clearTimeout(mensajesLimpiarAuto[msg.id]);
                            mensajesLimpiarAuto[msg.id] = undefined;
                        }
                    });
                })
                .catch(err => {
                    console.log("Error determinando mensajes fijados en el canal. Detalles a continuación.");
                    console.log(err);
                });
        }
    });
});

bot.login(process.env.TOKEN);
