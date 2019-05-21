from odoo import http, _
from odoo.addons.auth_signup.models.res_users import SignupError
from odoo.addons.web.controllers.main import ensure_db, Home
from odoo.exceptions import UserError, ValidationError
from odoo.http import request
from passlib.context import CryptContext
# import odoo.addons.website.controllers.main as main
import logging
import werkzeug
import werkzeug.utils
import requests
import hashlib
import json
_logger = logging.getLogger(__name__)


# class Website(main.Website):
#     @http.route(website=True, auth="public")
#     def web_login(self, redirect=None, *args, **kw):
#         main.ensure_db()
#         if request.httprequest.method == 'POST':
#             values = request.params.copy()
#             user = request.env['res.users'].search([('login', '=', str(values['login']))])
#             if user and user['login_with_ts_pro'] == True:
#                 values['error'] = _("Wrong login/password")
#                 response = request.render('web.login', values)
#                 response.headers['X-Frame-Options'] = 'DENY'
#                 return response
#             else:
#                 response = super(Website, self).web_login(redirect=redirect, *args, **kw)
#         response = super(Website, self).web_login(redirect=redirect, *args, **kw)
#         return response

class AuthSignupHome(Home):

    @http.route('/web/ts24-signin', type='http', auth='public', website=True, sitemap=False)
    def auth_ts24_signup(self, *args, **kw):
        qcontext = request.params.copy()

        # Check
        # qcontext['error'] = "DONE"
        # response = request.render('auth_signup.ts_login', qcontext)
        # response.headers['X-Frame-Options'] = 'DENY'
        # return response
        # End Check
        settings = request.env['res.config.settings'].sudo().get_values()
        if not settings['website_ts24_login'] or not settings['ts24_client_id'] or not settings['ts24_api_url']:
            error = ""
            if not settings['website_ts24_login']:
                error = "Login with TS24 Pro is no longer available"
            elif not settings['ts24_api_url']:
                error = "TS24 Rest api url is invalid"
            elif not settings['ts24_client_id']:
                error = "TS Auth password is invalid"

            return werkzeug.utils.redirect('/web/login?error='+error, 303)

        if 'error' not in qcontext and request.httprequest.method == 'POST':
            try:
                values = {key: qcontext.get(key) for key in ('login', 'password', 'login_with_ts_pro')}
                if not values['login_with_ts_pro'] or values['login_with_ts_pro'] != "t":
                    error = "Method not allow"
                    return werkzeug.utils.redirect('/web/login?error=' + error, 303)

                md5 = hashlib.md5()
                md5.update(values.get("password").encode('utf8'))
                datas = {
                    "userAccount": values.get("login"),
                    "passAccount": md5.hexdigest(),
                    "passAgent": settings['ts24_client_id'],
                    "userAgent": "ts24pro"
                }
                headers = {
                    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.90 Safari/537.36',
                    # 'Authorization': 'Your Auth',
                    'Content-Type': 'application/json',
                }
                url = settings['ts24_api_url'] + '?' \
                      'userAccount=' + datas['userAccount'] + '&passAccount=' + datas['passAccount'] + \
                      '&userAgent=' + datas['userAgent'] + '&passAgent=' + datas['passAgent']

                req = requests.session()
                req.headers = headers
                response = req.post(url, data=datas, headers=headers)
                responseResult = json.loads(response.content)
                print(json.dumps(responseResult))
                if not responseResult:
                    raise UserError(_("The server does not response"))
                elif responseResult['code'] == 'TS111':
                    values['name'] = responseResult['objResponse']['fullname']
                    encryptedPassword = CryptContext(['pbkdf2_sha512']).encrypt(values['password'])
                    user = request.env['res.users'].sudo().search([('login', '=', str(datas['userAccount']))])

                    if user:
                        result = user.sudo().write({"password": values['password'], "password_crypt": encryptedPassword})
                        if result:
                            return super(AuthSignupHome, self).web_login(*args, **kw)
                    else:
                        supported_langs = [lang['code'] for lang in
                                           request.env['res.lang'].sudo().search_read([], ['code'])]
                        if request.lang in supported_langs:
                            values['lang'] = request.lang
                        self._signup_with_ts(qcontext.get('token'), values)

                elif str(responseResult['code']) != 'TS111' and str(responseResult['code']) != "":
                    raise ValueError(_(responseResult['des']))
                elif responseResult['code'] == "TS001":
                    raise ValueError(_("TS Authentication password invalid"))
                else:
                    raise ValueError(_("Has an error occurred. Try again later"))
                # Done fullname

                # END SIGNUP
                return super(AuthSignupHome, self).web_login(*args, **kw)

            except Exception as e:
                if str(e).find("duplicate key value") != -1:
                    return super(AuthSignupHome, self).web_login(*args, **kw)
                else:
                    qcontext['error'] = str(e)

        response = request.render('ts_signup.ts_login', qcontext)
        response.headers['X-Frame-Options'] = 'DENY'
        return response

    def _signup_with_ts(self, token, values):
        db, login, password = request.env['res.users'].sudo().signup(values, token)
        request.env.cr.commit()  # as authenticate will use its own cursor we need to commit the current transaction
        uid = request.session.authenticate(db, login, password)
        if not uid:
            raise SignupError(_('Authentication Failed.'))