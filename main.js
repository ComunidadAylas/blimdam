const Discord = require('discord.js');
const bot = new Discord.Client();

/*                        *
 * Opciones configurables *
 *                        */
const comandoLimpiar = "!limpiar";
const canalesLimpieza = [ "comandos-trax" ];
const tiempoEsperaBorrado = 20000; // En ms

let mensajesLimpiarAuto = {};

bot.on('ready', () => {
    console.log('El bot está en marcha y aceptando eventos.');
    
    bot.on('message', (message) => {
        // Ver si hemos recibido un evento en un canal que nos interese
        if (message.channel.type === "text" && canalesLimpieza.indexOf(message.channel.name) > -1) {

            if (!message.channel.permissionsFor(bot.user).has("MANAGE_MESSAGES")) {
                // Si el bot no tiene permisos adecuados para hacer nada, avisar si es posible
                if (message.channel.permissionsFor(bot.user).has("SEND_MESSAGES")) {
                    message.channel.send("❌ No tengo los permisos necesarios para limpiar este canal.");
                }

            } else if (message.content === comandoLimpiar) {
                // Procesar comando para limpiar el canal de mensajes
                
                // Avisar al usuario de la operación
                if (message.channel.permissionsFor(bot.user).has("SEND_MESSAGES")) {
                    message.channel.send("✅ Se irán borrando los mensajes no fijados poco a poco. Ejecuta este comando varias veces si no se borran todos.");
                }
                
                let retardoInicial = true;
                message.channel.fetchMessages()
                .then(messages => {
                    // Borrar todos los mensajes no fijados
                    messages.array().forEach(msg => {
                        if (!msg.pinned) {
                            msg.delete(retardoInicial ? 10000 : 4000).catch(err => {
                                if (message.channel.permissionsFor(bot.user).has("SEND_MESSAGES")) {
                                    message.channel.send("❌ Ha ocurrido un error borrando un mensaje. ¡<@85378939890962432>, investiga esto!");
                                }
                                console.log(err);
                            });
                            retardoInicial = false;
                        }
                    });
                })
                .catch(err => {
                    if (message.channel.permissionsFor(bot.user).has("SEND_MESSAGES")) {
                        message.channel.send("❌ Ha ocurrido un error al obtener los mensajes del canal. ¡<@85378939890962432>, haz algo!");
                    }
                    console.log(err);
                });
            } else {
                // Mensaje normal (comando, etc.) en canal que controla este bot, borrar tras un tiempo
                mensajesLimpiarAuto[message.id] = bot.setTimeout(() => {
                    // Usamos message.delete() en vez de channel.bulkDelete() porque parece tener un funcionamiento más estable
                    message.delete().catch(err => {});
                    mensajesLimpiarAuto[message.id] = null;
                }, tiempoEsperaBorrado);
            }
        }
    });

    bot.on('channelPinsUpdate', (channel, time) => {
        if (channel.type === "text" && canalesLimpieza.indexOf(channel.name) > -1) {

            // Obtener mensajes fijados debería de ser más eficiente que mensajes enviados para Aylas
            channel.fetchPinnedMessages()
            .then(messages => {
                messages.forEach(msg => {
                    // Borrar este mensaje del mapa de mensajes candidatos de borrar
                    if (mensajesLimpiarAuto[msg.id]) {
                        clearTimeout(mensajesLimpiarAuto[msg.id]);
                        mensajesLimpiarAuto[msg.id] = null;
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


bot.login(process.env.TOKEN_API);
