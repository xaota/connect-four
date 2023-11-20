const {Transformer} = require("@parcel/plugin");

module.exports = new Transformer({
	async transform({asset}) {
		const source = await asset.getCode();
		asset.setCode(`export default ${JSON.stringify(source)}`);
		return [asset];
	}
});
