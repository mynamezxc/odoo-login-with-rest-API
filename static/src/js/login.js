odoo.define('website_ajax_login.website_ajax_login', function(require) {
    var ajax = require('web.ajax');
    $(document).ready(function() {

        var wk_block_ui;
        // Enable autofocus on ajax popup modal
        $('.modal').on('shown.bs.modal', function() {
          $(this).find('[autofocus]').focus();
        });

        // Click login button manually on pressing enter key
        $('#wk_ajax_login_form').keydown(function(event) {
            if (event.keyCode == 13) {
                $('#wk_login_button').click();
            }
        });

        // Click signup button manually on pressing enter key
        $('#wk_ajax_signup_form').keydown(function(event) {
            if (event.keyCode == 13) {
                $('#wk_signup_button').click();
            }
        });

        // Click confirm button manually on pressing enter key
        $('#wk_ajax_reset_form').keydown(function(event) {
            if (event.keyCode == 13) {
                $('#wk_reset_confirm_button').click();
            }
        });

        // Pop up ajax login form when user not logged in
        // check ajax element in dom and load the controller
        var ajax_element = document.getElementById('wk_ajax_login_doc');
        if (ajax_element != null) {
            ajax.jsonRpc('/web/session/wk_check', 'call').then(function(res) {
                wk_block_ui = res["wk_block_ui"]
                if (! res["wk_login"] && res["show_ajax_form_always"])
                {
                    if (wk_block_ui)
                    {
                        $('#wk_Modal_login').modal({
                            keyboard: false,
                            backdrop: 'static'
                        });
                    }
                    $("<div id='wk_ajax_loader'/>").appendTo('body');
                    ajax.jsonRpc('/wk_modal_login/', 'call', {
                            'url': location.href,
                            'name': 'parent'
                        })
                        .then(function(response) {
                            $.each(response, function(key, value) {
                                if (value.validation_endpoint.search("facebook") > 0) {
                                    link_provider('btn-facebook', value.auth_link);
                                }
                                if (value.validation_endpoint.search("googleapis") > 0) {
                                    link_provider('btn-googleplus', value.auth_link);
                                }
                                if (value.validation_endpoint.search("odoo") > 0) {
                                    link_provider('btn-odoo', value.auth_link);
                                }

                            });
                        });
                    var $redirect = $('#wk_Modal_login').find('input[name="redirect"]');
                    if(!$redirect.val()){
                        $redirect.val(window.location.pathname);
                    }
                    var element = document.getElementById("wk_ajax_loader");
                    element.parentNode.removeChild(element);
                    $('#wk_Modal_login').appendTo('body').modal('show');
                }
            });
        }


        $(document).on('show.bs.modal', '.modal', function (event) {
            $(document.body).addClass('model-open');
        });
        $(document).on('hide.bs.modal', '.modal', function (event) {
            $(document.body).removeClass('model-open');
        });
        var data = {};
        function custom_msg(element_id, status, msg) {
            if (status == true) {
                element_id.empty().append("<div class='alert alert-danger text-center' id='Wk_err'>" + msg + "<button type='button' class='close' data-dismiss='alert' aria-label='Close'><span class='res fa fa-times ' aria-hidden='true'></span></button></div>");
            }
            if (status == false) {
                element_id.empty();
            }
            return true;
        }

        function custom_mark(element_id, status) {
            if (status == true) {
                element_id
                    .parent()
                    .addClass('has-error has-feedback')
                    .append("<span class='fa fa-times form-control-feedback'></span>");

            } else if (status == false) {
                element_id
                    .parent()
                    .removeClass('has-error  has-feedback')
                    .children("span")
                    .remove();
            }
        }

        function custom_popover(element_id, status) {
            if (status == true) {
                element_id.attr("rel", "popover")
                    .popover({
                        placement: 'right',
                        html: true,
                        content: '<div id="popOverBox" style="height:50px;width:150px">' +
                            '<button type="button" id="popover_close" class="close  btn-default" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
                            'Not justifiable</span></div>',
                    });
                $("#popover_close").click(function(event) {
                    element_id.popover('hide');
                });
            } else if (status == false) {
                element_id.removeAttr("rel");
                element_id.popover('hide');
            }
        }
        $('#linklogin').on('click', function() {
            $('#wk_Modal_signup').modal('hide');
            $('#wk_Modal_login').appendTo('body').modal('show');
        });
        $('#linklogin2').on('click', function() {
            $('#wk_Modal_reset').modal('hide');
            $('#wk_Modal_login').appendTo('body').modal('show');
        });
        $('#linksignup').on('click', function() {
            if (wk_block_ui)
            {
                $('#wk_Modal_signup').modal({
                    keyboard: false,
                    backdrop: 'static'
                });
            }
            $('#wk_Modal_login').modal('hide');
            $('#wk_Modal_signup').appendTo('body').modal('show');
            var $redirect = $('#wk_Modal_signup').find('input[name="redirect"]');
            if(!$redirect.val()){
                $redirect.val(window.location.pathname);
            }
        });
        $('#wk_reset_password').on('click', function() {
            if (wk_block_ui)
            {
                $('#wk_reset_password').modal({
                    keyboard: false,
                    backdrop: 'static'
                });
            }
            $('#wk_Modal_login').modal('hide');
            $('#wk_Modal_reset').appendTo('body').modal('show');
        });
        $('#wk_login_button').on('click', function() {
            if (wk_block_ui)
            {
                $('#wk_Modal_login').modal({
                    keyboard: false,
                    backdrop: 'static'
                });
            }
            $('#wk_login_error').empty();
            var login = $(this).parent().parent().parent().find('#ajax_login');
            var password = $(this).parent().parent().parent().find('#ajax_password');
            var database = $(this).parent().parent().parent().find('.ajax_db :selected').val();
            var redirect = $('#wk_Modal_login').find('input[name="redirect"]').val();
            var input = {
                login: login.val(),
                password: password.val(),
                db: database,
                redirect : redirect,
            };

            $("<div id='wk_ajax_loader'/>").appendTo('body');
            ajax.jsonRpc('/shop/login/', 'call', input)
                .then(function(response) {

                    var element = document.getElementById("wk_ajax_loader");
                    if (response['uid'] != false) {
                        redirect_url = window.location.origin + response["redirect"]
	                    window.location.href = redirect_url;
                        $(window).load(function() {});
	                    // location.reload(true);
                    }
                    else {
                        element.parentNode.removeChild(element);
                        custom_msg($('#wk_login_error'), true, "Wrong login/password");
                        custom_mark($('.demo_loginclass'), true);
                        $('#Wk_err button').on('click', function() {
                            custom_msg($('#wk_login_error'), false, "");
                            custom_mark($('.demo_loginclass'), false);
                        });
                    }
                });
        });

        function link_provider(arg, link) {
            if ($("a").hasClass(arg) == true) {
                $('.' + arg).attr('href', link);
            }
            return true
        }

        $('#wk_address_linksignup').on('click', function() {
            $("<div id='wk_ajax_loader'/>").appendTo('body');
            if (wk_block_ui)
            {
                $('#wk_Modal_signup').modal({
                    keyboard: false,
                    backdrop: 'static'
                });
            }
            ajax.jsonRpc('/wk_modal_login/', 'call', {
                    'url': location.href,
                    'name': 'parent'
                })
                .then(function(response) {
                    $.each(response, function(key, value) {
                        if (value.validation_endpoint.search("facebook") > 0) {
                            link_provider('btn-facebook', value.auth_link);
                        }
                        if (value.validation_endpoint.search("googleapis") > 0) {
                            link_provider('btn-googleplus', value.auth_link);
                        }
                        if (value.validation_endpoint.search("odoo") > 0) {
                            link_provider('btn-odoo', value.auth_link);
                        }

                    });
                });
            $('input[name="redirect"]').val(window.location.pathname);
            var element = document.getElementById("wk_ajax_loader");
            element.parentNode.removeChild(element);
            $('#wk_Modal_signup').appendTo('body').modal('show');
        });

        $('#login_menu, #address_login_menu').on('click', function() {
            $("<div id='wk_ajax_loader'/>").appendTo('body');
            if (wk_block_ui)
            {
                $('#wk_Modal_login').modal({
                    keyboard: false,
                    backdrop: 'static'
                });
            }
            ajax.jsonRpc('/wk_modal_login/', 'call', {
                    'url': location.href,
                    'name': 'parent'
                })
                .then(function(response) {
                    $.each(response, function(key, value) {
                        if (value.validation_endpoint.search("facebook") > 0) {
                            link_provider('btn-facebook', value.auth_link);
                        }
                        if (value.validation_endpoint.search("googleapis") > 0) {
                            link_provider('btn-googleplus', value.auth_link);
                        }
                        if (value.validation_endpoint.search("odoo") > 0) {
                            link_provider('btn-odoo', value.auth_link);
                        }

                    });
                });
            var $redirect = $('#wk_Modal_login').find('input[name="redirect"]');
            if(!$redirect.val()){
                $redirect.val(window.location.pathname);
            }
            var element = document.getElementById("wk_ajax_loader");
            element.parentNode.removeChild(element);
            $('#wk_Modal_login').appendTo('body').modal('show');
        });

        $('#wk_signup_button').on('click', function() {
            var name = $(this).parent().parent().parent().parent().find('#signup_name');
            var login = $(this).parent().parent().parent().parent().find('#signup_login');
            var password = $(this).parent().parent().parent().parent().find('#signup_password');
            var confirm_password = $(this).parent().parent().parent().parent().find('#signup_confirm_password');
            var redirect = $('#wk_Modal_signup').find('input[name="redirect"]').val();
            var input = {
                'login': login.val(),
                'password': password.val(),
                'confirm_password': confirm_password.val(),
                'db': 'test24',
                'name': name.val(),
                'redirect': redirect
            };

            $("<div id='wk_ajax_loader'/>").appendTo('body');
            ajax.jsonRpc('/website_ajax_login/signup', 'call', input)
                .then(function(res) {
                    var element = document.getElementById("wk_ajax_loader");

                    list_res = res.error.split(",");
                    if (typeof(res['uid']) != "undefined") {
                        redirect_url = window.location.origin + res["redirect"]
	                    window.location.href = redirect_url;
                        $(window).load(function() {});
	                    // location.reload(true);
                    }
                    else{
                        element.parentNode.removeChild(element);
                        var responses = [
                            "All fields are madatory",
                            "Email is not valid",
                            "This email is already registered",
                            "Password not match",
                            "--Site is under construction please try after sometimes---",
                        ];
                        if (list_res.indexOf("filled") > 0) {
                            custom_msg($('#wk_signup_error'), true, responses[0]);
                            var a = jQuery("#wk_Modal_signup input:text[value=''] ,#wk_Modal_signup input:password[value=''] ");
                            a.each(function(index) {
                                $(this).parent()
                                    .addClass('has-error has-feedback')
                                    .append("<span class='fa fa-times form-control-feedback'></span>");
                            });
                        }
                        if (list_res.indexOf("email") > 0) {
                            custom_msg($('#wk_signup_error'), true, responses[1]);
                        }
                        if (list_res.indexOf("register") > 0) {
                            custom_msg($('#wk_signup_error'), true, responses[2]);
                        }
                        if (list_res.indexOf("confirm_password") > 0) {
                            custom_msg($('#wk_signup_error'), true, responses[3]);
                        }
                    }
                }).fail(function(a, b, c, d, e) {
            });
        });
        $('#wk_reset_confirm_button').on('click', function() {
            var form = $(this).closest('#wk_ajax_reset_form');
            var email = form.find('#reset_login').val();
            var err_msg = $('#wk_ajax_reset_msg');
            var input = {
                'login' : email,
            }
            if(email.length > 0){
                custom_msg(err_msg, false);
                $("<div id='wk_ajax_loader'/>").appendTo('body');
                ajax.jsonRpc('/website_ajax_login/reset_password', 'call', input)
                    .then(function(data){
                        var element = document.getElementById("wk_ajax_loader");
                        element.parentNode.removeChild(element);
                        if(data['error']){
                            custom_msg(err_msg, true, data['error']);
                        }
                        else{
                            if(data['message']){
                                err_msg.empty().append("<div class='alert alert-success text-center' id='Wk_err'>" + data['message'] + "</div>");
                                form.hide();
                            }
                        }
                    });
            }
            else{
                custom_msg(err_msg, true, "Email is required for reset password.");
            }
        });
    });
});
