"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ConnectionsController {
    async database({ response }) {
        let result;
        try {
            result = {
                status: 200,
                message: 'database connected',
            };
        }
        catch (e) {
            result = {
                status: 500,
                message: e.message,
            };
        }
        return response.send(result);
    }
}
exports.default = ConnectionsController;
//# sourceMappingURL=ConnectionsController.js.map
