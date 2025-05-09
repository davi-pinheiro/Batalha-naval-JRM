const WebSocket = require('ws');
const {randomUUID} = require('crypto');

const wss = new WebSocket.Server({ port: 8765 });
const clientes = new Map(); // nome -> conexão WebSocket

function comecar_jogo([])
{

}

function gerarIdUnico() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

const lobby = new Array();
const jogo = new Array();
const players_prontos = new Array();


wss.on('connection', (ws) => {
  let nome = null;

  ws.once('message', (data) => {
    nome = data.toString();

    const novo_id = randomUUID();

    clientes.set(novo_id, ws);

    clientes.get(novo_id).send(`id;${novo_id}`)

    lobby.push(novo_id);

    if(lobby.length >= 2)
    {
        while(lobby.length / 2 > 0)
        {
            jogo.push([lobby[0], lobby[1]])
            clientes.get(lobby[0]).send(`inimigo;${lobby[1]}`)
            clientes.get(lobby[1]).send(`inimigo;${lobby[0]}`)
            clientes.get(lobby[0]).send(`comeco1;1`)
            clientes.get(lobby[1]).send(`comeco1;2`)
            lobby.shift();
            lobby.shift();
        }
    }
    console.log(`${novo_id} conectado`);

    console.log(`Jogos montados: ${jogo.length}`)

    

    ws.on('message', (message) => {

        mensagem = message.toString().split(";");
        console.log(mensagem[0]);
        switch (mensagem[0]) {
            case 'disparo':
                clientes.get(`${mensagem[1]}`).send(`${mensagem[0]};${mensagem[2]};${mensagem[3]}`)
                break;
            case 'resposta':
                clientes.get(`${mensagem[1]}`).send(`${mensagem[0]};${mensagem[2]};${mensagem[3]};${mensagem[4]}`)
                break;
            case 'comecar':
                players_prontos.push(mensagem[1]);
                console.log(players_prontos)
                for(let i = 0; i < players_prontos.length; i++) {
                    if(players_prontos[i] == mensagem[2])
                    {
                        clientes.get(`${mensagem[1]}`).send(`comeco2`)
                        clientes.get(`${mensagem[2]}`).send(`comeco2`)
                        var index = players_prontos.indexOf(`${mensagem[1]}`, 0)
                        console.log(players_prontos)
                        players_prontos.splice(index, 1)
                        players_prontos.splice(i, 1);
                        i = players_prontos.length;
                    }
                }
                console.log(players_prontos)
            default:
                break;
        }
    });

    ws.on('close', () => {
        for(var i = 0; i < jogo.length; i++)
        {
            for(var j = 0; j < 2; j++)
            {
                if(jogo[i][j] == novo_id)
                {
                    console.log(`Removendo nos jogos: ${jogo[i][j]}`)
                    jogo[i].splice(j, 1);
                    console.log(`Removendo nos jogos: ${jogo[i][j]}`)
                    lobby.push(jogo[i][0])
                    clientes.get(jogo[i][0]).send('fim');
                    jogo[i].splice(0, 1);
                    jogo.splice(i,1);
                    break;
                }
            }
        }
        console.log(jogo);

        for(var i = 0; i < lobby.length; i++)
        {
            if(lobby[i] == novo_id)
            {
                console.log(`removendo no lobby: ${lobby[i]}`)
                lobby.splice(i, 1);
            }
        }
        console.log(lobby);

        clientes.delete(novo_id);
        console.log(`${nome} desconectado`);

        if(lobby.length >= 2)
        {
            while(lobby.length / 2 > 0)
            {
                jogo.push([lobby[0], lobby[1]])
                clientes.get(lobby[0]).send(`inimigo;${lobby[1]}`)
                clientes.get(lobby[1]).send(`inimigo;${lobby[0]}`)
                lobby.shift();
                lobby.shift();
            }
        }
    });
  });
});
