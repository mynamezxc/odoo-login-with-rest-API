# *-* encoding= utf-8 *-*
#  * @Author: Mynamezxc
#  * @Date: 2019-03-22 16:35:35
#  * @Last Modified by:   Mynamezxc
#  * @Last Modified time: 2019-03-22 16:35:35

{
    "name": "Login with restAPI",
    "summary":
    """
    Login, register with restAPI
    """,
    "version": "1.0",
    "author": "Mynamezxc",
    "maintainer": "Mynamezxc (Nguyen Hoang Nguyen)",
    "category": "Auth",
    "depends": [
        'base',
        'web',
        'auth_signup',
        'auth_oauth',
        ],
    'data': [
        'data/auth_oauth_data.xml',
        'views/auth_signup_login_templates.xml',
        'views/res_config_settings.xml',
        'views/template.xml'
    ],
    'demo': [],
    "qweb": [],
    "installable": True,
    "application": True,
    'bootstrap': True,
}