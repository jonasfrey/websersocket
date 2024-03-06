
import {
    f_add_css,
    f_s_css_prefixed,
    o_variables, 
    f_s_css_from_o_variables
} from "https://deno.land/x/f_add_css@1.1/mod.js"

import {
    f_o_html__and_make_renderable,
}
from 'https://deno.land/x/f_o_html_from_o_js@2.9/mod.js'

import {
    f_n_idx_binding_from_params,
    f_o_gpu_gateway, 
    f_o_gpu_gateway__from_simple_fragment_shader,
    f_o_gpu_gateway_webgpu,
    f_o_gpu_gateway_webgpu_dataitem__buffer_from_v_as_type,
    f_o_gpu_texture__from_o_web_api_object,
    f_render_o_gpu_gateway,
    f_render_o_gpu_gateway_webgpu,
    f_s_autogenerated_accessor_functions,
    f_s_binding_declaration__from_o_gpu_gateway_webgpu,
    f_update_data_in_o_gpu_gateway,
    f_update_data_in_o_gpu_gateway_webgpu,
}
from 'https://deno.land/x/gpugateway@0.3/mod.js'

o_variables.n_rem_font_size_base = 1. // adjust font size, other variables can also be adapted before adding the css to the dom
o_variables.n_rem_padding_interactive_elements = 0.5; // adjust padding for interactive elements 
f_add_css(
    `
    body{
        min-height: 100vh;
        min-width: 100vw;
        /* background: rgba(0,0,0,0.84);*/
        display:flex;
        justify-content:center;
    }
    canvas{
        width: 100%;
        height: 100%;
        position:fixed;
        z-index:-1;
    }
    .app{
        max-width: 1000px;
        width:100%;
        height: 100vh;
        display:flex;
        flex-direction: column;
        justify-content:flex-end;
    }
    ${
        f_s_css_from_o_variables(
            o_variables
        )
    }
    `

);


let o_canvas = document.createElement('canvas');
o_canvas.width = window.innerWidth
o_canvas.height = window.innerHeight
document.body.appendChild(o_canvas);

let o_gpu_gateway = f_o_gpu_gateway(
    o_canvas, 
    `#version 300 es
    in vec4 a_o_vec_position_vertex;
    out vec2 o_trn_nor_pixel;
    void main() {
        gl_Position = a_o_vec_position_vertex;
        o_trn_nor_pixel = (a_o_vec_position_vertex.xy) / 2.0; // Convert from clip space to texture coordinates
    }`,
    `#version 300 es
    precision mediump float;
    in vec2 o_trn_nor_pixel;
    out vec4 fragColor;
    uniform float n_ms_time;
    uniform vec2 o_trn_nor_mouse;
    uniform vec2 o_trn_nor_mouse__last;
    uniform vec2 o_scl_canvas;
    void main() {
        float nt = n_ms_time *.0001;
        vec2 o_trn_nor_p = o_trn_nor_pixel * vec2(1., o_scl_canvas.y/o_scl_canvas.x);
        vec2 o_trn_nor_m = (o_trn_nor_mouse -.5) * vec2(1., o_scl_canvas.y/o_scl_canvas.x);
        vec2 o_trn_nor_ml = (o_trn_nor_mouse__last -.5) * vec2(1., o_scl_canvas.y/o_scl_canvas.x);
        float n_len_mouse_delta =  length(o_trn_nor_m-o_trn_nor_ml);
        float n_len_diff_mp = length(o_trn_nor_p-o_trn_nor_m);
        
        fragColor = vec4(
            sin(n_len_diff_mp*33.+.1*n_len_mouse_delta+nt),
            sin(n_len_diff_mp*33.-.1*n_len_mouse_delta+nt),
            sin(n_len_diff_mp*33.+.0+nt),
            1.
        );
    }
    `,
)

let f_resize = ()=>{
    o_canvas.width = window.innerWidth
    o_canvas.height = window.innerHeight
    f_update_data_in_o_gpu_gateway(
        {o_scl_canvas: [
            o_canvas.width,
            o_canvas.height
        ]}, 
        o_gpu_gateway, 
    )
}
window.addEventListener('resize',()=>{
    f_resize()
});
f_resize()

let n_id_raf = 0;
let f_raf = function(){
    n_id_raf = window.requestAnimationFrame(f_raf);
    f_update_data_in_o_gpu_gateway(
        {
            n_ms_time: window.performance.now()
        }, 
        o_gpu_gateway, 
    )
    f_render_o_gpu_gateway(
        o_gpu_gateway, 
    );
}
n_id_raf = window.requestAnimationFrame(f_raf);

// Determine the current domain
const s_hostname = window.location.hostname;

// Create the WebSocket URL, assuming ws for http and wss for https
const s_protocol_ws = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const s_url_ws = `${s_protocol_ws}//${s_hostname}:${window.location.port}`;

// Create a new WebSocket instance
const o_ws = new WebSocket(s_url_ws);

// Set up event listeners for your WebSocket
o_ws.onopen = function(o_e) {
    console.log({
        o_e, 
        s: 'o_ws.onopen called'
    })
};

o_ws.onerror = function(o_e) {
    console.log({
        o_e, 
        s: 'o_ws.onerror called'
    })
};

o_ws.onmessage = function(o_e) {
    console.log({
        o_e, 
        s: 'o_ws.onmessage called'
    })
    o_state.a_o_msg.push(o_e.data);
    o_state?.o_js__a_o_mod?._f_render();

};

// To close the WebSocket
// o_ws.close();

let o_state = {
    s_msg: '', 
    a_o_msg: [], 
    o_trn_nor_mouse__last: [.5,.5],
    o_trn_nor_mouse: [.5,.5]
}
window.o_state = o_state
window.addEventListener('pointermove', (o_e)=>{
    o_state.o_trn_nor_mouse = [
        (o_e.clientX / window.innerWidth), 
        1.-(o_e.clientY / window.innerHeight), 
    ];
    f_update_data_in_o_gpu_gateway(
        {
            o_trn_nor_mouse: o_state.o_trn_nor_mouse__last,
            o_trn_nor_mouse__last: o_state.o_trn_nor_mouse
        }, 
        o_gpu_gateway, 
    )
    o_state.o_trn_nor_mouse__last = o_state.o_trn_nor_mouse
})

// //readme.md:start
document.body.appendChild(
    await f_o_html__and_make_renderable(
        {
            s_tag: 'div', 
            class: "app",
            a_o: [
                Object.assign(
                    o_state, 
                    {
                        o_js__a_o_mod: {
                            f_o_jsh: ()=>{
                                return {
                                    class: "a_o_msg",
                                    a_o: [
                                        o_state.a_o_msg.map(o=>{
                                            return {
                                                style: [
                                                    'display:flex',
                                                    'flex-direction:row',
                                                    `justify-content: ${(o.s_uuidv4 == o_state.s_uuidv4) ? 'end' : 'start'}`,
                                                    'align-items:end'
                                                ].join(';'),
                                                a_o: [
                                                    {
                                                        innerText: o.s_msg
                                                    },
                                                    {
                                                        style: 'color: darkgray;padding-left: 1rem; font-size:10px',
                                                        innerText: new Date(o.n_ts_ms).toISOString()
                                                    }
                                                ]
                                            }
                                        })
                                    ]
                                }
                            }
                        }
                    }
                ).o_js__a_o_mod,
            ]
        }
    )
);
// //readme.md:end