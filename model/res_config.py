# -*- coding: utf-8 -*-
from odoo import fields, models
from odoo import api
from odoo.exceptions import ValidationError
import logging
import json

_logger = logging.getLogger(__name__)


class ResUsers(models.Model):
    _inherit = "res.users"
    login_with_ts_pro = fields.Boolean(
        "Login with tspro"
    )


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    ts24_client_id = fields.Char(
        "TS24 Client ID"
    )
    website_ts24_login = fields.Boolean(
        "TS24 Login",
    )
    ts24_api_url = fields.Char(
        "TS24 Rest API URL"
    )

    @api.model
    def get_values(self):
        res = super(ResConfigSettings, self).get_values()
        ts24_id = self.env.ref('ts_signup.provider_ts', False)
        IrDefault = self.env['ir.default'].sudo()

        res.update(
            website_ts24_login=ts24_id.enabled,
            ts24_client_id=ts24_id.client_id,
            ts24_api_url=ts24_id.data_endpoint
        )
        return res

    @api.multi
    def set_values(self):
        super(ResConfigSettings, self).set_values()
        icp = self.env['ir.config_parameter']
        for record in self:
            config = record

            ts24_id = self.env.ref('ts_signup.provider_ts', False)
            if ts24_id:
                ts_vals = {
                    'enabled': config.website_ts24_login,
                    'client_id': config.ts24_client_id,
                    'data_endpoint': config.ts24_api_url,
                }
                ts24_id.write(ts_vals)
        return True