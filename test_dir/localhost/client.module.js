import {
    f_o_html__and_make_renderable,
}
from 'https://deno.land/x/f_o_html_from_o_js@2.9/mod.js'
import {
    f_display_test_selection_or_run_selected_test_and_print_summary,
    f_o_test
} from "https://deno.land/x/deno_test_server_and_client_side@1.1/mod.js"

// console.log(showdown)
import {
    f_add_css,
    f_s_css_prefixed,
    o_variables, 
    f_s_css_from_o_variables
} from "https://deno.land/x/f_add_css@1.1/mod.js"

import {
    f_s_ymd__from_n_ts_ms_utc
} from "https://deno.land/x/date_functions@1.4/mod.js"


let f_s_hms_left = function(n_ms_ts){
    let o_date = new Date(n_ms_ts)
    return [
        (24-o_date.getUTCHours()).toString().padStart(2,'0'),
        (60-o_date.getUTCMinutes()).toString().padStart(2,'0'),
        (60-o_date.getUTCSeconds()).toString().padStart(2,'0')
    ].join(':')
}
let f_s_date = function(n_ms_ts){

    let o_date = new Date(n_ms_ts);
    const a_s_day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const a_s_month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const s_day_of_week = a_s_day[o_date.getUTCDay()];
    const n_day_of_month = o_date.getUTCDate();
    const s_month = a_s_month[o_date.getUTCMonth()];
    const n_year = o_date.getUTCFullYear();
    
    return `${s_day_of_week}, ${n_day_of_month} ${s_month} ${n_year}`;
}
let n = 0.7
console.log(o_variables)
o_variables.o_hsla__fg.n_x = n + (Math.random()*(1.-n))
o_variables.o_hsla__fg.n_y = n + (Math.random()*(1.-n))
o_variables.o_hsla__fg.n_z = n + (Math.random()*(1.-n))
o_variables.o_hsla__fg.n_w = 0.9
o_variables.n_rem_font_size_base = 1.0 // adjust font size, other variables can also be adapted before adding the css to the dom
o_variables.n_rem_padding_interactive_elements = 0.6; // adjust padding for interactive elements 
f_add_css(
    `
    :root {
        font-family: Inter, sans-serif;
        font-feature-settings: 'liga' 1, 'calt' 1; /* fix for Chrome */
    }
    @supports (font-variation-settings: normal) {
        :root { font-family: InterVariable, sans-serif; }
    }
    h1, h2, h3, h4, h5, h6, p, li, div {
        line-height: 150% !important;
    }
    .tooltip {
        background: rgba(0,0,0,0.78);
        padding: 0.3rem;
        border-radius: 3px;
    }
    .app{
        overflow:hidden;
        min-height:100vh;
        max-height:100vh;
        min-width:100vw;
        max-width:100vw;
        display: flex;
        align-items:center;
        justify-content: space-between;
        flex-direction: column;
    }
    .flexcenter{
        display: flex;
        align-items:center;
        justify-content: center;
        flex-direction: column;
    }
    .bgimg{
        height: 100vh;
        width: 100vw;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        position: absolute;
        left: 0;
        top: 0;
        z-index: -1;
    
    }
    .text{
        padding: 0.6rem;
        margin: 0.6rem;
        background-color: rgba(0,0,0,0.7);
        border-radius: 9px;
        max-width: 1200px;
    }
    .clickable2:hover{
        cursor:pointer; 
        background: rgba(22,22,22,0.9);
    }
    ${
        f_s_css_from_o_variables(
            o_variables
        )
    }
    `
);
let o_date_now = new Date();
let o_date_today_latest = new Date(
    o_date_now.getUTCFullYear(),
    o_date_now.getUTCMonth(),
    o_date_now.getUTCDate(),
    23,
    59,
    59
 );
let n_ts_ms = new Date().getTime()
let n_ts_ms_latest = o_date_today_latest.getTime()
let f_update_from_n_ts_ms = async function(n_ts_ms){
    o_state.s_ymd = f_s_ymd__from_n_ts_ms_utc(n_ts_ms, 'UTC');
    o_state.s_domain = 'localhost';
    o_state.s_domain = 'thisisaweb.site';
    if(window.location.href.includes('deno.dev')){
        o_state.s_domain = 'thisisaweb.site'
    }
    o_state.s_url_api = `https://${o_state.s_domain}:8443/cors_allowed/${o_state.s_ymd}`
    o_state.s_url_file_json_ymd = `${o_state.s_url_api}/o_generation_info_${o_state.s_ymd}.json`
    o_state.s_url_file_wav_ymd = `${o_state.s_url_api}/generation${o_state.s_ymd}.wav`
    o_state.s_url_file_png_ymd = `${o_state.s_url_api}/generation${o_state.s_ymd}.png`

    var o_el_link = document.querySelector("link[rel~='icon']");
    if (!o_el_link) {
        o_el_link = document.createElement('link');
        o_el_link.rel = 'icon';
        document.head.appendChild(o_el_link);
    }
    o_el_link.href = o_state.s_url_file_png_ymd;
    o_state.o_info = await f_o_info(o_state.n_ts_ms);
}


class O_info{
    constructor(
        s_ymd, 
        o_generation_info
    ){
        this.s_ymd = s_ymd, 
        this.o_generation_info = o_generation_info
    }
}
let f_o_info = async function(n_ts_ms){
    let s_ymd = f_s_ymd__from_n_ts_ms_utc(n_ts_ms, 'UTC');
    let o_info = o_state.a_o_info.find(o=>o.s_ymd == s_ymd);
    if(!o_info){
        o_info = new O_info(
            s_ymd,
            await(await(fetch(
                o_state.s_url_file_json_ymd
            ))).json()
        ) 
        o_state.a_o_info.push(o_info)
    }
    return o_info
}

let o_state = {
    n_ts_ms,
    s_domain: '',
    o_info: {},
    a_o_info: [],
    s_ymd: '',
    s_url_api: '',
    s_url_file_json_ymd:'',
    s_url_file_wav_ymd:'',
    s_url_file_png_ymd:'',
    o_state__tooltip: {}, 
    n_ts_ms_latest,
    n_ms_ts_ut_earliest_generation: new Date('2024-02-29').getTime()
}

window.o_state = o_state
document.body.appendChild(
    await f_o_html__and_make_renderable(
        Object.assign(
            o_state, 
            {
                o_js__all: {
                    f_o_jsh:async ()=>{
                        await f_update_from_n_ts_ms(o_state.n_ts_ms)
                        return {
                            class: "app",
                            a_o : [
                                f_o_js__tooltip(o_state.o_state__tooltip),
                                {
                                    class: "bgimg",
                                    style: [
                                        `background-image: url(${o_state.s_url_file_png_ymd})`
                                    ].join(';')
                                },
                                //
                                {
                                    class: 'flexcenter',
                                    a_o: [
                                        {
                                            class: 'text',
                                            s_tag: "h1", 
                                            innerText: "An AIGI a day, keeps the doctor away!",
                                        },
                                        {
                                            style: "display:flex",
                                            a_o: [
                                                Object.assign(
                                                    o_state, 
                                                    {
                                                        o_js__prev: {
                                                            f_o_jsh:()=>{
                                                                let n_ts_ms_prev = o_state.n_ts_ms-24*60*60*1000;
                                                                let b_prevable = ( n_ts_ms_prev > o_state.n_ms_ts_ut_earliest_generation)
                                                                return {
                                                                    class: [
                                                                        'text', 
                                                                        (b_prevable) ? 'clickable2' : ''
                                                                    ].join(' '), 
                                                                    innerText: (b_prevable) ? '<' : ':(',
                                                                    onclick: async ()=>{
                                                                        o_state.n_ts_ms = n_ts_ms_prev
                                                                        await o_state.o_js__all._f_render()
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                ).o_js__prev,
                                                {
                                                    class: 'text',
                                                    s_tag: "h5",
                                                    innerText: f_s_date(o_state.n_ts_ms)
                                                }, 
                                                Object.assign(
                                                    o_state, 
                                                    {
                                                        o_js__timer: {
                                                            f_o_jsh:()=>{
                                                                window.setTimeout(()=>{
                                                                    o_state.o_js__timer._f_update()
                                                                },1000)
                                                                let n_ms_next = o_state.n_ts_ms+24*60*60*1000
                                                                let b_nextable = (n_ms_next <= o_state.n_ts_ms_latest)
                                                                return {
                                                                    class: [
                                                                        'text', 
                                                                        (b_nextable) ? 'clickable2' : ''
                                                                    ].join(' '), 
                                                                    innerText: (b_nextable) ? '>' : f_s_hms_left(new Date().getTime()), 
                                                                    onclick : async ()=>{
                                                                        if(b_nextable){
                                                                            o_state.n_ts_ms = (n_ms_next)
                                                                            await o_state.o_js__all._f_render()
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                ).o_js__timer
                                                
                                            ]
                                        }
                                    ]
                                },
                                {
                                    class: 'flexcenter',
                                    a_o: [
                
                                        {
                                            data_tooltip: 'This audio was also generated by AI',
                                            s_tag: "audio", 
                                            controls:true,
                                            autoplay: true, 
                                            muted: true,
                                            loop: true,
                                            a_o:[
                                                {
                                                    s_tag: 'source',
                                                    src: o_state.s_url_file_wav_ymd
                                                }, 
                                                {
                                                    class: 'text',
                                                    innerText: "This browser does not support the audio element."
                                                }
                                            ]
                                        },
                                        // {
                                        //     data_tooltip: 'This was the input prompt sent to the API.',
                                        //     class: 'text',
                                        //     s_tag: 'h6',
                                        //     innerText: o_state?.o_generation_info?.o_generation_image?.o_request_data?.prompt
                                        // },
                                        {
                                            data_tooltip: 'This was the input prompt used to generate the image.',
                                            class: 'text',
                                            s_tag: 'h6',
                                            innerText: o_state?.o_info.o_generation_info?.o_generation_image?.o_response_info?.o_from_json?.data?.[0]?.revised_prompt
                                        }
                                    ]
                                },
                                
                
                            ]
                        }
                    }
                }
            }
        ).o_js__all
    )
);
