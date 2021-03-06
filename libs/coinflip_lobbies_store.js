"use strict";
const db    = require("../app/database/models"),
      redis = require("redis");
const redisClient = (process.env.REDIS_URL ? 
            redis.createClient(process.env.REDIS_URL) : redis.createClient());

module.exports = (() => {

    let lobbyCount = 0;

    const getCoinflipLobbyCount = (cb) => {
        redisClient.scard("coinflip_lobbies", cb);
    };

    const createLobbyCount = (lobbyId, cb = null) => {
        redisClient.sadd("filled_coinflip_lobbies", lobbyId);
        redisClient.set(`filled_coinflip_lobbies:${lobbyId}`, 10);
    };

    const getLobbyCount = (lobbyId, cb = null) => {
        redisClient.get(`filled_coinflip_lobbies:${lobbyId}`, (err, lobbyCount) => {
            if(cb) {
                if(err) {
                    cb(err);
                } else {
                    cb(err, lobbyCount);
                }
            }
        });
    };

    const getLobbyCounts = (cb = null) => {
        redisClient.smembers(`filled_coinflip_lobbies`, (err, lobbyIds) => {
            if(err && cb) {
                cb(err);
            }
            
            let multiTask = redisClient.multi();
            lobbyIds.forEach(lobbyId => multiTask.get(`filled_coinflip_lobbies:${lobbyId}`));
            multiTask.exec((err, results) => {
                if(cb) {
                    if(err) {
                        cb(err);
                        return;
                    }
                    let lobbyCountDowns = {};
                    results.forEach((lobbyTimer, index) => {
                        lobbyCountDowns[lobbyIds[index]] = lobbyTimer;
                    });
                    cb(null, lobbyCountDowns);
                }
            });
        });
    };

    const deleteLobbyCount = (lobbyId) => {
        redisClient.srem("filled_coinflip_lobbies", lobbyId);
        redisClient.del(`filled_coinflip_lobbies:${lobbyId}`);
    };

    const decrementLobbyCount = (lobbyId, cb = null) => {
        redisClient.decr(`filled_coinflip_lobbies:${lobbyId}`, (err, currentValue) => {
            if(cb) {
                if(err) {
                    cb(err);
                } else {
                    cb(null, currentValue);
                }
            }
        });
    };

    const decrementAllLobbyCounts = (cb = null) => {
        redisClient.smembers(`filled_coinflip_lobbies`, (err, lobbyIds) => {
            if(err) {
                throw new Error(err);
            }

            let multiTask = redisClient.multi();
            lobbyIds.forEach(lobbyId => multiTask.decr(`filled_coinflip_lobbies:${lobbyId}`));
            multiTask.exec((err, results) => {
                if(err) {
                    cb(err);
                }
                if(cb) {
                    let lobbyCountDowns = {};
                    results.forEach((lobbyTimer, index) => {
                        lobbyCountDowns[lobbyIds[index]] = lobbyTimer;
                    });
                    cb(null, lobbyCountDowns);
                }
            });
        });
    };

    const createLobby = (user, items, cb = null) => {

        let totalDeposited = items.reduce((acc, currValue) => acc + parseFloat(currValue.suggested_price)/100, 0).toFixed(2);
        console.log(items);
        console.log(totalDeposited);
        db.user.update({
            skinsWagered: db.Sequelize.literal(`skinsWagered + ${items.length}`),
            totalGambled: db.Sequelize.literal(`totalGambled + ${totalDeposited}`)
        }, {
            where: { steamId: user.id }
        });
        db.user.addExperience(user.id, totalDeposited);

        let multiTask = redisClient.multi();

        multiTask.sadd("coinflip_lobbies", lobbyCount);
        multiTask.hmset(`coinflip_lobbies:${lobbyCount}:host`, {
            "total": totalDeposited,
            ...user
        });
        items.forEach(item => {
            multiTask.sadd(`coinflip_lobbies:${lobbyCount}:host:items`, JSON.stringify(item));
            multiTask.sadd(`coinflip_lobbies:${lobbyCount}:host:items:ids`, item);
        });
        multiTask.exec((err, results) => {
            if(err) {
                cb(err);
                return;
            }
            lobbyCount++;
            if(cb !== null) {
                cb(null, results);
                return
            }
        });
    };

    const deleteLobby = (lobbyId, cb = null) => {

        let multiTask = redisClient.multi();

        multiTask.srem("coinflip_lobbies", lobbyId);
        multiTask.del(`coinflip_lobbies:${lobbyId}:host`);
        multiTask.del(`coinflip_lobbies:${lobbyId}:host:items`);
        multiTask.del(`coinflip_lobbies:${lobbyId}:challenger`);
        multiTask.del(`coinflip_lobbies:${lobbyId}:challenger:items`);

        multiTask.exec((results) => {
            if(cb !== null) {
                cb(null);
            }
        });
    };

    const setLobbyChallengerStake = (user, items, lobbyId, cb = null) => {
        console.log("The lobby id is", lobbyId);
        let totalDeposited = items.reduce((acc, currValue) => acc + parseFloat(currValue.suggested_price)/100, 0).toFixed(2);
        db.user.update({
            skinsWagered: db.Sequelize.literal(`skinsWagered + ${items.length}`),
            totalGambled: db.Sequelize.literal(`totalGambled + ${totalDeposited}`)
        }, {
            where: { steamId: user.id }
        });
        db.user.addExperience(user.id, totalDeposited);

        redisClient.hget(`coinflip_lobbies:${lobbyId}:host`, "coinColor", (hostCoinColor) => {
            
            let challengerCoinColor = hostCoinColor == "red" ? "blue" : "red";

            let multiTask = redisClient.multi();
            multiTask.hmset(`coinflip_lobbies:${lobbyId}:challenger`, {
                "id": user.id,
                "user": user.user,
                "avatar": user.avatar,
                "total": totalDeposited,
                "coinColor": challengerCoinColor
            });
            items.forEach(item => {
                multiTask.sadd(`coinflip_lobbies:${lobbyId}:challenger:items`, JSON.stringify(item));
                multiTask.sadd(`coinflip_lobbies:${lobbyId}:challenger:items:ids`, item.id);
            });
    
            multiTask.exec((err, results) => {
    
                if(cb !== null) {
                    if(err) {
                        cb(err);
                    } else {
                        cb(null, results);
                    }
                }
            });
        });
    };

    const getLobby = (lobbyId, cb) => {

        let multiTask = redisClient.multi();
        multiTask.hgetall(`coinflip_lobbies:${lobbyId}:host`);
        multiTask.smembers(`coinflip_lobbies:${lobbyId}:host:items`);
        multiTask.hgetall(`coinflip_lobbies:${lobbyId}:challenger`);
        multiTask.smembers(`coinflip_lobbies:${lobbyId}:challenger:items`);

        multiTask.exec((err, results) => {
            if(err) {
                if(cb) {
                    cb(err);
                }
                return;
            }
            let lobby = { id: lobbyId };
            lobby.host = results[0];
            lobby.host.items = [];
            for(let item of results[1]) {
                lobby.host.items.push(JSON.parse(item));
            }

            if(results[2] !== null) {
                lobby.challenger = results[2];
                lobby.challenger.items = [];
                for(let item of results[3]) {
                    lobby.challenger.items.push(JSON.parse(item));
                }
            }
            cb(null, lobby);
        });
    };

    const getLobbies = (cb) => {

        redisClient.smembers("coinflip_lobbies", (err, lobbyIds) => {

            if(lobbyIds == null) {
                cb(null, []);
                return;
            }
            
            let multiTask = redisClient.multi();

            lobbyIds.forEach(lobbyId => {
                multiTask.hgetall(`coinflip_lobbies:${lobbyId}:host`);
                multiTask.smembers(`coinflip_lobbies:${lobbyId}:host:items`);
                multiTask.hgetall(`coinflip_lobbies:${lobbyId}:challenger`);
                multiTask.smembers(`coinflip_lobbies:${lobbyId}:challenger:items`);
            });

            multiTask.exec((err, results) => {

                let lobbies = [];
                for(let index = 0, length = results.length; index < length; index += 4) {
                    lobbies.push({
                        id: lobbyIds[index/4]
                    });

                    lobbies[index/4].host = results[index];
                    lobbies[index/4].host.items = [];
                    for(let item of results[index+1]) {
                        lobbies[index/4].host.items.push(JSON.parse(item));
                    }

                    if(results[index+2] !== null) {
                        lobbies[index/4].challenger = results[index+2];
                        lobbies[index/4].challenger.items = [];
                        for(let item of results[index+3]) {
                            lobbies[index/4].challenger.items.push(JSON.parse(item));
                        }
                    }
                }
                cb(null, lobbies);
            });
        });
    };

    const addOffer = offerId => {

        redisClient.sadd("coinflip_offers", offerId);
    };

    const offerExists = (offerId, cb) => {
        redisClient.smembers("coinflip_offers", (err, offers) => {
            if(err) {
                throw new Error(err);
            }
            if(offers == null) {
                cb(false);
                return;
            }
            if(offers.indexOf(offerId.toString()) !== -1) {
                cb(true);
                return;
            }
            cb(false);
        });
    };

    return ({
        getCoinflipLobbyCount,
        createLobbyCount,
        getLobbyCount,
        getLobbyCounts,
        deleteLobbyCount,
        decrementLobbyCount,
        decrementAllLobbyCounts,
        createLobby,
        deleteLobby,
        setLobbyChallengerStake,
        getLobby,
        getLobbies,
        addOffer,
        offerExists
    });
})();