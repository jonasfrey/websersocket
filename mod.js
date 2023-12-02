

import {
    f_o_command
} from "https://deno.land/x/o_command@0.9/mod.js"

import { contentType as f_s_response_header_content_type__from_s } from "https://deno.land/std@0.208.0/media_types/content_type.ts";

import {
    f_o_html__and_make_renderable
} from "https://deno.land/x/f_o_html_from_o_js@1.9/mod.js"

import {
    f_s_n_beautified
} from "https://deno.land/x/handyhelpers@2.2/mod.js"

let f_o_ssl_config = async function (
    o_config
) {
    let o_cert_config_default = {
        s_country_name_2_letter_code: 'CH',
        s_state_or_province: 'Switzerland',
        s_locality_name: 'Bern',
        s_organization_name: 'MyCompany',
        s_common_name: 'MyCommonName',
        s_email_address: 'my.email@dom.com',
        s_path_certificate_file: (o_config?.s_path_certificate_file)
            ? o_config.s_path_certificate_file
            : `./self_signed_cert.crt`,
        // : `./self_signed_cert_${o_config.s_hostname}_${o_config.n_port}.crt`,
        s_path_key_file: (o_config?.s_path_key_file)
            ? o_config.s_path_key_file
            : `./self_signed_key.key`,
        // : `./self_signed_key_${o_config.s_hostname}_${o_config.n_port}.key`,
    }
    let o = o_cert_config_default

    let b_certifciates_ok = false;
    let a_n_u8_cert = null
    let a_n_u8_key = null
    let s_cert = null;
    let s_key = null;
    try {
        a_n_u8_cert = await Deno.readFile(o.s_path_certificate_file);
        a_n_u8_key = await Deno.readFile(o.s_path_key_file);

    } catch (error) {
        if (error.name == 'NotFound') {
            console.log('this will createa create a PEM key certificate cert.crt and a PEM key file key.key')
            // console.log(`you can do this with the following command \n${a_s_arg.join(' ')}`)
            // let s_expected = `execute_command`
            // let s = prompt(`do you want to execute the command ? if so type: ${s_expected}`);
            for (let s in o_cert_config_default) {
                o_cert_config_default[s] = prompt(`${s}`, o_cert_config_default[s]);
            }

            var a_s_arg = [
                'openssl',
                'req',
                '-newkey',
                'rsa:4096',
                '-x509',
                '-sha256',
                '-days',
                '3650',
                '-nodes',
                '-subj',
                `"${[
                    `/C=${o.s_country_name_2_letter_code}`,
                    `/ST=${o.s_state_or_province}`,
                    `/L=${o.s_locality_name}`,
                    `/O=${o.s_organization_name}`,
                    `/CN=${o.s_common_name}`
                ].join('')}"`,
                `-out`,
                o.s_path_certificate_file,
                `-keyout`,
                o.s_path_key_file
            ]
            // if(s == s_expected){
            let o_command = await f_o_command(a_s_arg)
            // }
            a_n_u8_cert = await Deno.readFile(o.s_path_certificate_file);
            a_n_u8_key = await Deno.readFile(o.s_path_key_file);
        } else {
            throw error
        }
    }

    let o_text_decoder = new TextDecoder();
    return {
        a_n_u8_cert,
        a_n_u8_key,
        s_content_cert: o_text_decoder.decode(a_n_u8_cert),
        s_content_key: o_text_decoder.decode(a_n_u8_key),

    }
}


let f_websersocket_serve = async function (
    a_o_configuration = [
        {
            n_port: 8000,
            s_hostname: 'localhost',
            b_https: true,
            f_v_before_return_response: async function (
                o_request
            ) {
                let s_path_part = `getproxy_deno.land`
                if (o_request.url.includes(s_path_part)) {
                    let s_url_new = `https://deno.land/${o_request.url.split(s_path_part).pop()}`

                    var o_response = await fetch(s_url_new);
                    console.log(o_response)
                    // return o_request.respondWith(
                    //     new Response(o_response.body)
                    // )

                    return new Response(
                        o_response.body,
                    );
                }
            }
        }
    ]
) {
    for (let o_config of a_o_configuration) {

        o_config.port = o_config.n_port
        o_config.hostname = o_config.s_hostname
        let o_ssl_config = {}
        if (
            o_config.b_https
            ||
            (
                o_config.s_path_certificate_file
                && o_config.s_path_key_file
            )
        ) {
            o_config.b_https = true
            o_ssl_config = await f_o_ssl_config(
                o_config
            );
            Object.assign(
                o_config,
                {
                    cert: o_ssl_config.s_content_cert,
                    key: o_ssl_config.s_content_key
                },
            )
        }

        console.log(`starging server with o_config`)
        console.log(Object.keys(o_config).map(s => {
            return `${s}: ${(['cert', 'key'].includes(s)) ? '***' : o_config[s]}`
        }).join('\n'))
        // console.log(o_ssl_config)
        if (o_config.n_port < 1024) {
            console.log(`the port number of this config is ${o_config.n_port}, for port numbers lower than 1024 you may need to run this script with more privileges`)
        }
        Deno.serve(
            o_config,
            // {
            //     cert: s_cert, 
            //     key: s_key
            // },
            async (o_request) => {

                let o = await o_config.f_v_before_return_response(o_request)
                if (o instanceof Response) {
                    return o
                }

            },
        );

    }
    console.log(`server(s) running:`)
    console.log(`${a_o_configuration.map(o => {
        return `   http${(o.b_https) ? 's' : ''}://${o.s_hostname}:${o.n_port}`
    }).join('\n')}`)
}
let f_v_before_return_response__fileserver = async function (
    o_request,
    s_path_prefix = '.'
) {
    if (o_request.headers.get("upgrade") != "websocket") {

    }
    let o_url = new URL(o_request.url);
    let s_separator = '/';
    // o_url.pathname = o_url.pathname.split(s_separator).filter(v=>v.trim()!='').join(s_separator)
    let s_path_file_or_folder = `${s_path_prefix}${o_url.pathname}`;
    let o_stat = null;
    try {
        o_stat = await Deno.stat(s_path_file_or_folder);
    } catch (error) {
        if (error.name == "NotFound") {
            return new Response("404 Not Found", { status: 404 })
        }
    }

    let s_resp_header_content_type = 'text/html';
    let v_body = null;

    if (o_stat.isFile) {
        let a_n_u8__file = await Deno.readFile(s_path_file_or_folder);
        s_resp_header_content_type = f_s_response_header_content_type__from_s(
            s_path_file_or_folder?.split('/').pop().split('.').pop()
        )
        v_body = a_n_u8__file

    } else {
        // console.log(s_path_file_or_folder)

        let a_o_entry = [];
        for await (const o_entry of Deno.readDir(s_path_file_or_folder)) {
            // console.log(o_entry.name);
            a_o_entry.push(
                Object.assign(
                    o_entry,
                    await Deno.stat(`${s_path_file_or_folder}/${o_entry.name}`)
                )
            )
        }
        let a_s_path_part = s_path_file_or_folder
            .replace(s_path_prefix, 'home/')
            .split(s_separator)
            .filter(s => s.trim() != '')

        // console.log(a_s_path_part)
        v_body = f_o_html__and_make_renderable(
            {
                style: "font-family:monospace;font-size:1.2rem;display:flex;flex-direction:column;",
                a_o: [
                    {
                        s_tag: "style", 
                        innerHTML: `
                        html{
                            font-family:monospace;
                            font-size:1.2rem;
                        }
                        table{
                            font-size:1.2rem;
                        }
                        body {
                            background-color: #121212; /* Dark background */
                            color: #e0e0e0; /* Light text color */
                        }
                        a {
                            color: #93bdf9; 
                            text-decoration: none; /* Optional: Removes underline from links */
                        }
                        
                        a:hover {
                            color: #ff79c6; /* Different color when hovering */
                            text-decoration: underline;
                        }
                        
                        a:active {
                            color: #ff5555; /* Different color when link is clicked */
                        }
                        
                        a:visited {
                            color: #bd93f9; /* Different color for visited links */
                        }
                        th, td{
                            padding: 0.3rem;
                            text-align:end;
                        }
                        tr:hover{
                            background:#323232
                        }
                        `
                    },
                    {
                        style: "display:flex;flex-direction:row;",
                        s_tag: 'h1',
                        a_o: [
                            {
                                innerHTML: 'Index of&nbsp;',
                            },
                            ...a_s_path_part.map((s, n_idx) => {
                                return {
                                    style: "display:flex;flex-direction:row;",
                                    a_o: [
                                        {
                                            innerText: '/'
                                        },
                                        {
                                            s_tag: 'a',
                                            href: [
                                                (n_idx > 0) ? '/' : '',
                                                a_s_path_part
                                                    .slice(1, n_idx + 1)
                                                    .join(s_separator) + '/',
                                            ].join(''),
                                            innerText: s
                                        },

                                    ]
                                }

                            }),
                            {
                                innerText: '/'
                            },
                        ],
                    },
                    {
                        s_tag: 'table',
                        a_o: [
                            {
                                s_tag: 'tr',
                                a_o: [
                                    { s_tag: 'th', innerText: 'Mode' },
                                    { s_tag: 'th', innerText: 'Size' },
                                    { s_tag: 'th', innerText: 'Name' },
                                ]
                            },
                            ...[
                                Object.assign(
                                    o_stat,
                                    { name: '.' }
                                ),
                                {
                                    name: '..',
                                    isDirectory: true,

                                },
                                ...a_o_entry,
                            ].map(
                                o => {
                                    // console.log(o)
                                    let s_href = `${o_url
                                            .pathname
                                            .split(s_separator)
                                            .filter(v => v.trim() != '')
                                            .join(s_separator)
                                        }/${o.name}${(o.isDirectory) ? '/' : ''}`
                                    if (!s_href.startsWith('/')) {
                                        s_href = `/${s_href}`
                                    }
                                    let s_type = [
                                        (o.isFile) ? '-' : false,
                                        (o.isDirectory) ? 'd' : false,
                                        (o.isSymlink) ? 'l' : false,
                                        (o.isBlockDevice) ? 'b' : false,
                                        (o.isCharDevice) ? 'c' : false,
                                        (o.isFifo) ? 'p' : false,
                                        (o.isSocket) ? 's' : false,
                                    ].filter(v => v).join('')
                                    let a_s_permission = new Array(3).fill(0).map((n, n_idx) => {
                                        return [
                                            (o.mode & (0b1 << (n_idx * 3 + 2))) ? 'r' : '-',
                                            (o.mode & (0b1 << (n_idx * 3 + 1))) ? 'w' : '-',
                                            (o.mode & (0b1 << (n_idx * 3 + 0))) ? 'x' : '-',
                                        ].join('');
                                    }).reverse()
                                    return {
                                        s_tag: "tr",
                                        onclick: `window.location.href = '${s_href}'`,
                                        a_o: [
                                            {
                                                s_tag: 'td',
                                                innerText: `${s_type}${a_s_permission.join(' ')}`
                                            },
                                            {
                                                s_tag: 'td',
                                                innerText: (o.size) ?
                                                    `${f_s_n_beautified(o.size)} B`
                                                    : ''
                                            },
                                            {
                                                s_tag: 'td',
                                                a_o: [
                                                    {
                                                        s_tag: 'a',
                                                        href: s_href,
                                                        innerText: o.name
                                                    }
                                                ]
                                            },
                                        ]

                                    }
                                }
                            )

                        ]
                    }

                ]
            }
        ).outerHTML
        s_resp_header_content_type = 'text/html'
    }
    // console.log(o_url)
    // console.log(v_body)
    // var o_response = await fetch(s_url_new);
    // console.log(o_response)
    return new Response(
        v_body,
        {
            headers: {
                // "Cache-Control": null,
                // "Clear-Site-Data": null,
                // "Connection": null,
                // "Content-Disposition": null,
                // "Content-DPR": null,
                // "Non-standard Deprecated": null,
                // "Content-Encoding": null,
                // "Content-Language": null,
                "Content-Length": v_body.length,
                // "Content-Location": null,
                // "Content-Range": null,
                // "Content-Security-Policy": null,
                // "Content-Security-Policy-Report-Only": null,
                "Content-Type": s_resp_header_content_type,
            }
        }
    )
}
let f_v_before_return_response__proxy = async function (
    o_request,
    s_url_proxy = 'https://deno.land/'

) {
    let o_url = new URL(o_request.url);

    if (s_url_proxy.endsWith('/')) {
        s_url_proxy = s_url_proxy.slice(0, -1);
    }
    let s_url_new = `${s_url_proxy}${o_url.pathname}`
    // console.log(s_url_new)
    var o_response = await fetch(
        s_url_new,
        Object.assign(
            {
                headers: o_request.headers,
                method: o_request.method,
            },
            ...[
                (o_request.method !== 'GET' && o_request.method != 'HEAD')
                    ? o_request.body
                    : false
            ].filter(v => v)
        )

    );
    // console.log('o_response')
    // console.log(o_response)
    return new Response(
        o_response.body,
        {
            ok: o_response.ok,
            redirected: o_response.redirected,
            status: o_response.status,
            statusText: o_response.statusText,
            type: o_response.type,
            url: o_response.url,
            headers: o_response.headers,
        }
    );
}
let f_o_response_from_o_socket = function (
    o_socket,
    v_data
) {
    o_socket.send(v_data);

}

export {
    f_websersocket_serve,
    f_v_before_return_response__fileserver,
    f_v_before_return_response__proxy
    // o_state, 
}