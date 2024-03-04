import {
    f_generate_template
} from "./mod.js"

let s_path_abs_file_current = new URL(import.meta.url).pathname;
let s_path_abs_folder_current = s_path_abs_file_current.split('/').slice(0, -1).join('/');
await f_generate_template(`${s_path_abs_folder_current}/test_dir`);