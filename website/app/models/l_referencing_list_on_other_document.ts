import { Schema, model } from "mongoose";
import { IFngSchemaDefinition } from "../../../src/fng-schema";

const shelfRef = {type: 'lookupList', collection:'', id:'', property: 'shelves', value:'location'};

const LSchemaDef : IFngSchemaDefinition = {
  description: {type: String, required: true, list: {}},
  warehouse: {type: Schema.Types.ObjectId, ref:'k_referencing_self_collection', form: {directive: 'fng-ui-select', fngUiSelect: {fngAjax: true}}},
  shelf: {type: Schema.Types.ObjectId, lookupListRef: {collection:'k_referencing_self_collection', id:'$warehouse', property: 'shelves', value:'location'}},
};

const LSchema = new Schema(LSchemaDef);

let L;
const name = 'l_referencing_list_in_other_document';
try {
  L = model(name);
} catch (e) {
  L = model(name, LSchema);
}

module.exports = {
  model: L
};


