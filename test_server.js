//readme.md:start
//md: # web-ser-socket (also 'web-SIR-socket') is a small web/-server/-socket
//md: ![](./banner_logo.png)
import {
    f_websersocket_serve, 
    f_v_before_return_response__fileserver,
    f_v_before_return_response__proxy
} from "./mod.js"

//md: ## generate template structure
//md: this will generate a template for a websersocket including http and websocket request handling
//md: also it includes a client front end application and client and server side testing script

import {
    f_generate_template
} from "./mod.js"

let s_path_abs_file_current = new URL(import.meta.url).pathname;
let s_path_abs_folder_current = s_path_abs_file_current.split('/').slice(0, -1).join('/');
await f_generate_template(`${s_path_abs_folder_current}/desired_websersocket_root_dir`);


//md: ## examples
//md: websersocket can be used in different ways...

let s_path_file_current = new URL(import.meta.url).pathname;
let s_path_folder_current = s_path_file_current.split('/').slice(0, -1).join('/'); 
// console.log(s_path_folder_current)
// Deno.exit()
await f_websersocket_serve(
    [
        {
            b_https: true,
            n_port: 4343,
            s_hostname: 'localhost',
            s_path_certificate_file: './custom.crt',
            s_path_key_file: './custom.key',
            f_v_before_return_response: async function(o_request){
                // important if the connection is secure (https), 
                // the socket has to be opened with the wss:// protocol
                // from the client
                // for client: const socket = new WebSocket(`${window.location.protocol.replace('http', 'ws')}//${window.location.host}`);
                if(o_request.headers.get('Upgrade') == 'websocket'){

                    const { 
                        socket: o_socket,
                        response: o_response
                    } = Deno.upgradeWebSocket(o_request);

                    o_socket.addEventListener("open", () => {
                        console.log("a client connected!");
                        o_socket.send('hello from websocket');
                    });
                    
                    o_socket.addEventListener("message", async (event) => {
                        console.log(`a message was received ${event}`)
                    });
                    
                    return o_response;
                }

                return f_v_before_return_response__fileserver(
                    o_request,
                    `${s_path_folder_current}/test_for_fileserver`
                )
            }
        },
        {
            n_port: 1234, 
            s_hostname: 'deno_land_proxy.localhost', 
            b_https: true, 
            f_v_before_return_response: async(o_request)=>{
                return f_v_before_return_response__proxy(
                    o_request,
                    'https://deno.land/'
                )
            }
        },
        {
            n_port: 4312, 
            s_hostname: 'proxyfromgetparam.localhost', 
            b_https: true, 
            f_v_before_return_response: async(o_request)=>{
                let o_url = new URL(o_request.url);
                let s_url = o_url.search.split('=').pop();
                console.log(s_url)
                if(!s_url){
                    return new Response('please provide a url in a get parameter, for example ...?s_url=https://deno.land')
                }
                return f_v_before_return_response__proxy(
                    o_request,
                    s_url
                )
            }
        },

        {
            n_port: 8000, 
            s_hostname: 'thispersondoesnotexist.localhost', 
            b_https: true,
            f_v_before_return_response: async function(
                o_request
            ){
                return f_v_before_return_response__proxy(
                    o_request,
                    'https://this-person-does-not-exist.com/'
                )

            }
        },

    ]
)

//readme.md:start
