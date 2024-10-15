

import {
    f_o_command
} from "https://deno.land/x/o_command@0.9/mod.js"

import { isAbsolute as f_b_path_is_absolute } from "https://deno.land/std@0.50.0/path/posix.ts";

import { contentType as f_s_response_header_content_type__from_s } from "https://deno.land/std@0.208.0/media_types/content_type.ts";

import {
    f_o_html__and_make_renderable
} from "https://deno.land/x/f_o_html_from_o_js@5.0.0/mod.js"

import {
    f_s_n_beautified
} from "https://deno.land/x/handyhelpers@5.0.0/mod.js"
import { ensureDir as f_ensure_folder } from "https://deno.land/std@0.218.2/fs/ensure_dir.ts";



let s_path_abs_file_current = new URL(import.meta.url).pathname;
let s_path_abs_folder_current = s_path_abs_file_current.split('/').slice(0, -1).join('/');

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
    let s_path_file_or_folder = `${s_path_prefix}${decodeURIComponent(o_url.pathname)}`;
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
        console.log(a_n_u8__file)
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
        let o = {
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
                                    onclick: `globalThis.location.href = '${s_href}'`,
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
        let o_html = await f_o_html__and_make_renderable(
            o
        )
        console.log(o_html.outerHTML);
        v_body = o_html.outerHTML
        s_resp_header_content_type = 'text/html'
    }
    // console.log(v_body)
    // console.log(v_body.length)
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



let f_generate_template = async function(
    s_path_abs_folder
){
    if(!f_b_path_is_absolute(s_path_abs_file_current)){
        throw Error(`${s_path_abs_folder} path has to be absolute!`)
    }

    let b = await prompt(`do you really want to initialize a template in the directory '${s_path_abs_folder}':?`, 'y')
        == 'y';
    if(!b){
        Deno.exit(1)
    }
    let s_url_folder_gitrepo = `https://raw.githubusercontent.com/jonasfrey/websersocket/main`

    let o_resp = await fetch(`https://deno.land/x/websersocket`);
    let s_url_latest = o_resp.url;
    
    let s_path_rel_file_config = './o_config.gitignored.json'
    let s_uuidv4 = crypto.randomUUID();
    try {
        let s_json = await Deno.readTextFile(
            `${s_path_abs_folder}/${s_path_rel_file_config}`
        )
        // console.log({s_json})
        let o = JSON.parse(
            s_json
        )
        // console.log(o.s_uuidv4);
        console.log(`template was already generated for s_uuidv4:'${s_uuidv4}'`)
        Deno.exit(1)
    } catch (error) {
        // config file does not exist yet, 
        s_uuidv4 = crypto.randomUUID();
    }

    let o_s_path_s_content = {
        './template/websersocket_{s_uuidv4}.js': '',
        './template/kill_nohup_deno_run_websersocket_{s_uuidv4}.sh': '',
        './template/nohup_deno_run_websersocket_{s_uuidv4}.sh': '',
        './template/restart_nohup_run_websersocket_{s_uuidv4}.sh': '',
        './template/process_monitor_websersocket_{s_uuidv4}.sh': '',
        './template/test.js': '',
        './template/generate_markdown_readme.js': '',
        './template/.gitignore_tmp_disabled': '',
        './template/o_config.gitignored.examplenotignored.json': '',
        './template/o_config.gitignored.json': '',
//         './template/self_signed_cert_{s_uuidv4}.crt': `-----BEGIN CERTIFICATE-----
// MIIFoTCCA4mgAwIBAgIUex9lUFqj/M8zOs2tC3nwVctSHPQwDQYJKoZIhvcNAQEL
// BQAwYDELMAkGA1UEBhMCQ0gxFDASBgNVBAgMC1N3aXR6ZXJsYW5kMQ0wCwYDVQQH
// DARCZXJuMRUwEwYDVQQKDAxXZWJTZXJTb2NrZXQxFTATBgNVBAMMDFdlYlNlclNv
// Y2tldDAeFw0yNDAzMDYwOTM4NTFaFw0zNDAzMDQwOTM4NTFaMGAxCzAJBgNVBAYT
// AkNIMRQwEgYDVQQIDAtTd2l0emVybGFuZDENMAsGA1UEBwwEQmVybjEVMBMGA1UE
// CgwMV2ViU2VyU29ja2V0MRUwEwYDVQQDDAxXZWJTZXJTb2NrZXQwggIiMA0GCSqG
// SIb3DQEBAQUAA4ICDwAwggIKAoICAQC+3h0/Ho5PBuvpvy/z8y/iVGR80xHYJcfL
// E6kuTL6Isrzf1Z3O0RoQioyUybJM/hSZaMYL2HknwBh/4ArmyuDkbt8sNQL5m0C1
// W2OVwjJnBdu6SsYN4vZeciATLCR/rjZFZSHS5ju0L8s8XG8Kyrx/EgJ7CsPch4J+
// DYPI7SDwMriSHwX+bfu96N7SgMcpl/O1JqW93mrWCIlwxOqPuTifUlt1uVomYgic
// 6dRzwYFc6WF2r/5mGV+6YSjgrgO/qymNCYQD9f7AnRcDu+gTOPC2qRGre7RKajj9
// RiNQ/VgXSBteYDnIpRPUb8fWBdKeou1jwRazeHC7lh+NSz2reIbOVeUuBk+9usDH
// rh/ZMpOegL3zuZQHSm11QFb3lzzISGaLBl/EPpHI8iSqjUKBTk4oFi7PVwoojvvW
// irUKbJvzyeCxN8EVXTrNYSt8sUd+8C9Ge5qE8m2drX8g/rwmPl/XT/1P6JbyPb/u
// u4bUhP6ox36FUt4QLkg3nXRz7EsbzUMLn9sdM6H+NQ0kcI84PsUVpwgKkJJFGDPs
// vTCQcqELt758WyHxF7CgLy/3TxAh1aCbQ5JVfK+UJ3TqcuITfJ8khcQxdWztOGeH
// Xtq28vXimNoTSBryOKM3SrNGu0iQ34jQ9Vgt7g/5+NbhlQwkGXS3vKL/+rYe1dJO
// kO3JcfIHeQIDAQABo1MwUTAdBgNVHQ4EFgQU+uVWy0UH0f2eeYnw5t49LS2pyjQw
// HwYDVR0jBBgwFoAU+uVWy0UH0f2eeYnw5t49LS2pyjQwDwYDVR0TAQH/BAUwAwEB
// /zANBgkqhkiG9w0BAQsFAAOCAgEAvWG/DCt0JQ+/OxYWfUYXub0u5x2l8p2bSkI+
// iM3oGfhvpsATiyKr2K+CneL/lq4gOJe8oENfX9iV7NGzmMi0cLdbXscR7TQH7G+4
// SoMILaxNvFETcXzOKQXPPTewNJzP7IByvPjiViewSZSKB9CFpQGEVPjvIRP9TkSY
// C5ikn2jC3wiHRPpq6j7pHkeP+gGdFjcz/Cr8g1mwAB0bdayGPf2m0Dzqu0bcC81F
// stbeGzq6YjFRTbyJgkN62FiwPlFO3wF0GEjuJ7odzsug/UAv1BorADHNAhlgxxbg
// pb59a0mhNPDPqTx0znaRtEHgCpJecNqp4fNuKXpjbmTwBvIQ3OKKJjgw3k7w5Zro
// 9Tor7WsLKeoxeb1Ge8lU3BdVKsXkuX/Z+u/eSexJ0kK6edsdtN4wjsZ5MdO8MC6d
// WgmSsKgkjOFyliHku+o79W9fKxe4QY4VB0oM6x9IqbNyVMaVIKZdTpIsfd217aZL
// DWhGoJQ/iUk4+CoMOlkW+fq8K8vjgsvRAgct2DBVJ8/kBHEnpyil/UUr98nA4jJ1
// PrfB2zQwNMWFuN58J5+kFLL5/v6VrL5b3MPrZVoYBY5Wb7XssWuNxLL3pAmYQYNu
// 59bAr0Lbdtz9YB01sKrgeT/zZoKHUvZImP1E5zEkOEdX33XidKULpt7BwUCJVpBX
// aA9oyOA=
// -----END CERTIFICATE-----`,
//         './template/self_signed_key_{s_uuidv4}.key': `-----BEGIN PRIVATE KEY-----
// MIIJQwIBADANBgkqhkiG9w0BAQEFAASCCS0wggkpAgEAAoICAQC+3h0/Ho5PBuvp
// vy/z8y/iVGR80xHYJcfLE6kuTL6Isrzf1Z3O0RoQioyUybJM/hSZaMYL2HknwBh/
// 4ArmyuDkbt8sNQL5m0C1W2OVwjJnBdu6SsYN4vZeciATLCR/rjZFZSHS5ju0L8s8
// XG8Kyrx/EgJ7CsPch4J+DYPI7SDwMriSHwX+bfu96N7SgMcpl/O1JqW93mrWCIlw
// xOqPuTifUlt1uVomYgic6dRzwYFc6WF2r/5mGV+6YSjgrgO/qymNCYQD9f7AnRcD
// u+gTOPC2qRGre7RKajj9RiNQ/VgXSBteYDnIpRPUb8fWBdKeou1jwRazeHC7lh+N
// Sz2reIbOVeUuBk+9usDHrh/ZMpOegL3zuZQHSm11QFb3lzzISGaLBl/EPpHI8iSq
// jUKBTk4oFi7PVwoojvvWirUKbJvzyeCxN8EVXTrNYSt8sUd+8C9Ge5qE8m2drX8g
// /rwmPl/XT/1P6JbyPb/uu4bUhP6ox36FUt4QLkg3nXRz7EsbzUMLn9sdM6H+NQ0k
// cI84PsUVpwgKkJJFGDPsvTCQcqELt758WyHxF7CgLy/3TxAh1aCbQ5JVfK+UJ3Tq
// cuITfJ8khcQxdWztOGeHXtq28vXimNoTSBryOKM3SrNGu0iQ34jQ9Vgt7g/5+Nbh
// lQwkGXS3vKL/+rYe1dJOkO3JcfIHeQIDAQABAoICAGb8rkc6k4rsryqm8Jbu5y12
// X+pCcWRxrkZTS3wiCMT1vJgCSW4owamfOI+n7T9B8Zd9Qy9tFKJwMkf9eaRiX8qi
// UGUoDXzlWpsAvtE1wcB5FsCETC1+A3WemtP9g4wpUjtLgF6twBVPnJfrQDdQgTkH
// XLNLcbdynuSpIiyuVpGErLabar6IVcd4+ZIXzl8REHz0Z4X1lyv52z8v4Wi/hl/h
// LlxtMMl5KDCSswHqrYSWoPJLsDcjBdYpSsdA3eDz2C2zrrn8aANCQALRxz1oAept
// e41N6FAm1K1ExRWUPY4CaFIaFdO/zt1XmzpOVgEm5HRo4XjhSeLN9CRnLtVw6TtI
// bDqs/HGgtsLXydcN38ltd6Ifl5628cvGt62DQjOe4BBjBAz6+wD6Q3Xzq8mrR+dT
// hwODp3qZ5aE8uhOXeNQ+M36aq0k8mXXI3NCj8qfyK+RxEvnZJCZKaL2J9EIdUPjA
// YVKNzsmwEhM/XfH+RcAJCWY28dl/ulwDe7ga34QwJLP/radZiAliElTy6RS6uC5i
// wk5CKlhLCjAYx0/ku+qXEe6jwSBEFk62hM00YO/sX2Eaid4RRH8ER+D3yzxS/SRM
// Qj6l6lBE7kE7AzTH+dJuZiMiIRpzKzjtmIf7TYdIYDvlvMD81EB/hlxDHu9LGqni
// ElrD4/v3XZLUwkp5E+yhAoIBAQD3UjjMXbxBUWWI/W+6LSg+23sw1PdN99QoSmjd
// HuC1jMCIBx2XK9niC2OFE8v1k9U7u+SbXK1jpo8T+5AHWt99pJI4AtZQxeEMMR3r
// dJF6jz82I//fVNBE/7pLwBPuIZjKcZaLFrQCnNhpDjgqypDR/diGYJ651J66JO1U
// xuDD5kATpBwSU4oK8tc2JXakGmvIdxMRQNIGipSBSbtBLeYKpoLqMnadHFKagR4y
// qczxumgr28Bku2hraHM++wGc/iRMaUm7kNr/vUZKRfMFK4ltqz8HVC8ofdU3yEiT
// omL6ngadTKq9iNnVTocDhWqmtU4Vr7ohStniu83rWLyAa52dAoIBAQDFkL/Ka96Z
// 2bCo4wDOFG4VDPCvXPsPaJfWmCG1jtypzU0VrP151Vz2YZVIIyUDlLtz0hBuXjjj
// xvG0APyXozCYr1ZzoeW+f2rjk1ev5MQo7pYGhxsacAqXdaDbBSKA/Ec6ZnLnMwRH
// 0n0RYVVccxa1R1gjfiZBRRuLwliEFrSELgq+uDEEeBaWSmDhpKxWEurjEG5SU/6T
// rYVUGZ6fReQqtUY9NE+C6jqi8roPT1KUID+7tTAjlzb6nqJ/LTCcRv3ApClUEQw/
// P8ab/5O8G/ZkgB3Y0Rh8czEK7fbJTwbq/L3+Yy0shdAWRz57uhtTJAiJki+x5qFB
// ucdb5DKFQ5iNAoIBAQDQDDCPagKlB63cESXdfYMvbT4yE9R9mA62XfHcoM7yqhaD
// 10iDFHZS+rWbCs42JUfo2eQy9UE+ZKxTaPj91unOLZR63ZgflnX75Y1/ti1y5fGM
// v7fMzPHuORkkA85AMa7wDaFQG6cN05cQuM9y37f3jgyI7dpYBI4JlGq5OBt3b8dT
// PmgG2pNzJlj3yYgF/9vPZKt7hgWnTwghwj5tVAkByJS0IgM5osuyAQ/AGqq2ZdKf
// oloz4pqyT8kyn7/5qqgqRx+pUu+G1le8vx7xqHAQ+08oAR8ydrfYFvlGiAGvRSPX
// StkOW4KzNz3ILoFK/5VSFOMEgozLeKR+Z8UaWmzZAoIBAAFz+RUiCfcTtMrpMH5T
// hCO/fp2rj2UjncpEQCs3q8PL8L8yEIMu4IonWZO4PnNySpalet107/Is6mYqg7ER
// 0C+vSnF7RVdLVJvr3385rX+nkY7mu3pMTKekg9RYi1JriJKTYlD0/RkSIT1Ze+k8
// J3SZ27oXGWztdzBl84S1Lgqy0/1nGWUxBOmCDohaT7IqXXPiEQ2l9H9djVd7AMGn
// H/B4eNXGZrdNxbShGGE4ciEIw687u+jnGc5qEEPjLzJXC1K5Ylxt66sjavCGxq1h
// f0Rp9M49a3Ku3jN4YJJGdISR60vNqu1i5o7jY0BBtCW+ZBmu647hZVo4ZZD1crGs
// N5kCggEBAJtV1ysqZ6B0NnNL7IJqY7Aj5Oer5xRjpoGV7EFbgfEnV7nO315YVxqh
// 9hfGnfW0zdQ4ctEniY02cgskPKtJ5tsBMXkZqPAZLUKnBQiKQ6frfO1GxielecMp
// GThsXQPq1auPhhHclemdZ8EqfdFcIsKTJ9llr0fX1ugb4V+GKKgR4xCC78K07zWQ
// V8j+GSz/b0SZUlBRFwsLSaU0nedFm57keWScyul3F5Yjgl2qiKkrqx97BqHe0gbD
// kDJiPAYyqFE9oDEWS2Z2pwyqgA14aC4GOvAS8zbeURjJ4z1OhluTRK/9WBvg8loL
// 9kLIzR1xmZIpP8vAKCvSqlo48OYPIyw=
// -----END PRIVATE KEY-----`,
        // './template/self_signed_cert_{s_uuidv4}.crt':'',
        // './template/self_signed_key_{s_uuidv4}.key':'',
        './template/classes.module.js': '',
        './template/functions.module.js': '',
        './template/runtimedata.module.js': '',
        './template/localhost/classes.module.js': '',
        './template/localhost/functions.module.js': '',
        './template/localhost/runtimedata.module.js': '',
        './template/localhost/client.html': '',
        './template/localhost/client.module.js': '',
        './template/localhost/test_client.html': '',
        './template/localhost/test_client.module.js': ''
    }
    await f_ensure_folder(`${s_path_abs_folder}/localhost`);
    for(let s in o_s_path_s_content){
        let s_content = o_s_path_s_content[s];
        if(s_content.trim() == ''){
            // let s_url = `https://deno.land/x/websersocket@0.3/${s}`;
            let s_url = `${s_url_folder_gitrepo}/${s}`
            console.log(s_url)
            let o2 = await fetch(s_url);    
            s_content = (await (o2.text())).replaceAll('{s_uuidv4}', s_uuidv4);
            s_content = s_content.replaceAll('{s_url_latest}', s_url_latest);
        }    

        // the gitignore has to be handled specially since if it would be named '.gitignore' it would not get commited to the git directory
        if(s == './template/.gitignore_tmp_disabled'){
            s = './template/.gitignore'
        }
                
        let s_path_abs_new = `${s_path_abs_folder}/${s.replace('./template', './')}`.replaceAll('{s_uuidv4}', s_uuidv4);
        console.log(`writing file: ${s_path_abs_new}`)
        await Deno.writeTextFile(
            s_path_abs_new,
            s_content,
            {
                mode: (s.endsWith('.sh')) ? 0o764 : 0o664
            }
        )
    }
    let s_full_name_for_mit_license = prompt(`for the MIT license, enter your full name:`);
    await Deno.writeTextFile(
        `${s_path_abs_folder}/LICENSE`,
        `MIT License

Copyright ${(new Date().getFullYear()).toString()} ${s_full_name_for_mit_license}

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
        `,
        {
            mode: 0o664
        }
    )

    console.log('done')

}
export {
    f_generate_template,
    f_websersocket_serve,
    f_v_before_return_response__fileserver,
    f_v_before_return_response__proxy
    // o_state, 
}