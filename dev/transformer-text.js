//import {Optimizer} from '@parcel/plugin';
const {Transformer} = require("@parcel/plugin");
module.exports = new Transformer({
	async transform({asset}) {
		asset.setCode(`export /*hi!*/ default ${JSON.stringify(await asset.getCode())}`);
		return [asset];
	}
});
