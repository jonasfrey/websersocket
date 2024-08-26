
import {
    f_websersocket_serve,
    f_v_before_return_response__fileserver
} from "https://deno.land/x/websersocket@1.0.3/mod.js"

import {
    O_ws_client
} from "./classes.module.js"
import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";

import { f_o_config } from "./functions.module.js";
import {
    f_a_o_entry__from_s_path
} from "https://deno.land/x/handyhelpers@4.0.7/mod.js"

let s_path_abs_file_current = new URL(import.meta.url).pathname;
let s_path_abs_folder_current = s_path_abs_file_current.split('/').slice(0, -1).join('/');
const b_deno_deploy = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;

let a_o_ws_client = []

let f_o_fetch_cached = async function( 
    n_ms_delta_max = 1000*60*5
){
    let n_ms_now = new Date().getTime();
    let a_v_param = Array.from(arguments);
    let o = await o_kv.get([a_v_param[1]]);
    let b_update = (o?.value?.n_ms) ? Math.abs(o?.value?.n_ms-n_ms_now) > n_ms_delta_max : true;
    if(b_update){
        let o_resp = await fetch(...a_v_param.slice(1));
        let o_data = await o_resp.json();
        let o = {
            n_ms: n_ms_now, 
            o_data
        };
        let b_res = await o_kv.set([a_v_param[1]], o); 
    }
    return o?.value?.o_data
}

const o_kv = await Deno.openKv();
// let o_config = await f_o_config();
// console.log({o_config});

let s_api_key = `rtrjRM`
let s_path_abs_folder_cached_shaders = './localhost/cached_shaders';
if(!b_deno_deploy){

    await ensureDir(s_path_abs_folder_cached_shaders)// deno deploy is read only...
}

let f_handler = async function(o_request){

    // websocket 'request' handling here
    if(o_request.headers.get('Upgrade') == 'websocket'){

        const {
            socket: o_socket,
            response: o_response
        } = Deno.upgradeWebSocket(o_request);
        let o_ws_client = new O_ws_client(
            crypto.randomUUID(),
            o_socket
        )
        a_o_ws_client.push(o_ws_client);

        o_socket.addEventListener("open", (o_e) => {
            console.log({
                o_e, 
                s: 'o_socket.open called'
            })
        });

        o_socket.addEventListener("message", async (o_e) => {
            console.log({
                o_e, 
                s: 'o_socket.message called'
            })
            let v_data = o_e.data;
            a_o_ws_client
                .filter(o=>o!=o_ws_client)  // send to all other clients, comment out to send to all clients
                .forEach(o=>{
                    o.o_socket.send('message was received from a client')

                })
        });
        o_socket.addEventListener("close", async (o_e) => {
            a_o_ws_client.splice(a_o_ws_client.indexOf(o_ws_client), 1);
            console.log({
                o_e, 
                s: 'o_socket.close called'
            })
        });

        return o_response;
    }
    // normal http request handling here
    let o_url = new URL(o_request.url);
    if(o_url.pathname == '/'){
        return new Response(
            await Deno.readTextFile(
                `${s_path_abs_folder_current}/localhost/client.html`
            ),
            { 
                headers: {
                    'Content-type': "text/html"
                }
            }
        );
    }
    if(o_url.pathname == '/f_a_o_shader'){
        let n_ms_cache = (
            o_url.href.includes('#nocache')
        ) ? 0 : 1000*60*5;
        let n_ms_now = new Date().getTime();
        let o = await f_o_fetch_cached(
            n_ms_cache,
            `https://www.shadertoy.com/api/v1/shaders/query/shaderclockdenodev?key=${s_api_key}`
        );
        // console.log(o)
        let a_s_id_shader = [
            ...o.Results,
            'Dds3WB' , 
            'MtGSRm'
            //manually added shaders, (shader must be set to 'public + api' )
        ];

        let a_o_shader = await Promise.all(a_s_id_shader.map(async s_shader_id=>  {

            let o = await f_o_fetch_cached(
                n_ms_cache,
                `https://www.shadertoy.com/api/v1/shaders/${s_shader_id}?key=${s_api_key}`
            )

            return o

        }));
        // await Deno.writeTextFile('./localhost/a_o_shader.json', JSON.stringify(a_o_shader))
        // console.log(a_o_shader)

        return new Response(
            JSON.stringify(a_o_shader),
            { 
                headers: {
                    'Content-type': "application/json"
                }
            }
        );
    }

    return f_v_before_return_response__fileserver(
        o_request,
        `${s_path_abs_folder_current}/localhost/`
    )

}

let s_name_host = Deno.hostname(); // or maybe some ip adress 112.35.8.13
let b_development = s_name_host != 'the_server_name_here';
let s_name_host2 = (b_development) ? 'localhost': s_name_host;
// let o_info_certificates = {
//     s_path_certificate_file: './self_signed_cert_{s_uuidv4}.crt',
//     s_path_key_file: './self_signed_key_{s_uuidv4}.key'
// }
await f_websersocket_serve(
    [
        {
            n_port: 8080,
            b_https: false,
            s_hostname: s_name_host,
            f_v_before_return_response: f_handler
        },
        ...[
            (!b_deno_deploy) ? {
                // ...o_info_certificates,
                n_port: 8443,
                b_https: true,
                s_hostname: s_name_host,
                f_v_before_return_response: f_handler
            } : false
        ].filter(v=>v)   
    ]
);