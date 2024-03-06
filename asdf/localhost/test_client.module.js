import {
    f_display_test_selection_or_run_selected_test_and_print_summary,
    f_o_test
} from "https://deno.land/x/deno_test_server_and_client_side@1.1/mod.js"

//readme.md:start
//md: ![./logo.png](./logo.png)
//readme.md:end

//./readme.md:start
//md: # Title of the project 7847a97c-1188-4068-8c5b-878de6440fb3
//./readme.md:end

// import { stuff} from './client.module.js'

let a_o_test = [
    f_o_test(
        'basic_example_convert_js_to_html', 
        async ()=>{
            //./readme.md:start
            //md: ## most simple example 
            //md: description
            f_asser_equals(1,1);
            //./readme.md:end
        }
    ),
]


f_display_test_selection_or_run_selected_test_and_print_summary(
    a_o_test
)
// //readme.md:end