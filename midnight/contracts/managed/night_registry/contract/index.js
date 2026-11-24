import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
__compactRuntime.checkRuntimeVersion('0.21.0');

const _descriptor_0 = new __compactRuntime.CompactTypeBytes(32);

const _descriptor_1 = __compactRuntime.CompactTypeJubjubPoint;

const _descriptor_2 = __compactRuntime.CompactTypeField;

const _descriptor_3 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

class _NameRecord_0 {
  alignment() {
    return _descriptor_2.alignment().concat(_descriptor_2.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_3.alignment())))));
  }
  fromValue(value_0) {
    return {
      owner: _descriptor_2.fromValue(value_0),
      tip_pk: _descriptor_2.fromValue(value_0),
      enc_pk: _descriptor_0.fromValue(value_0),
      social: _descriptor_0.fromValue(value_0),
      email: _descriptor_0.fromValue(value_0),
      index: _descriptor_3.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_2.toValue(value_0.owner).concat(_descriptor_2.toValue(value_0.tip_pk).concat(_descriptor_0.toValue(value_0.enc_pk).concat(_descriptor_0.toValue(value_0.social).concat(_descriptor_0.toValue(value_0.email).concat(_descriptor_3.toValue(value_0.index))))));
  }
}

const _descriptor_4 = new _NameRecord_0();

const _descriptor_5 = __compactRuntime.CompactTypeBoolean;

class _JubjubSchnorrSignature_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_2.alignment());
  }
  fromValue(value_0) {
    return {
      announcement: _descriptor_1.fromValue(value_0),
      response: _descriptor_2.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.announcement).concat(_descriptor_2.toValue(value_0.response));
  }
}

const _descriptor_6 = new _JubjubSchnorrSignature_0();

const _descriptor_7 = __compactRuntime.CompactTypeJubjubScalar;

class _tuple_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment()));
  }
  fromValue(value_0) {
    return [
      _descriptor_0.fromValue(value_0),
      _descriptor_0.fromValue(value_0),
      _descriptor_0.fromValue(value_0)
    ]
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0[0]).concat(_descriptor_0.toValue(value_0[1]).concat(_descriptor_0.toValue(value_0[2])));
  }
}

const _descriptor_8 = new _tuple_0();

const _descriptor_9 = new __compactRuntime.CompactTypeVector(1, _descriptor_2);

class _JubjubSchnorrHashInput_0 {
  alignment() {
    return _descriptor_2.alignment().concat(_descriptor_2.alignment().concat(_descriptor_2.alignment().concat(_descriptor_2.alignment().concat(_descriptor_9.alignment()))));
  }
  fromValue(value_0) {
    return {
      annX: _descriptor_2.fromValue(value_0),
      annY: _descriptor_2.fromValue(value_0),
      pkX: _descriptor_2.fromValue(value_0),
      pkY: _descriptor_2.fromValue(value_0),
      msg: _descriptor_9.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_2.toValue(value_0.annX).concat(_descriptor_2.toValue(value_0.annY).concat(_descriptor_2.toValue(value_0.pkX).concat(_descriptor_2.toValue(value_0.pkY).concat(_descriptor_9.toValue(value_0.msg)))));
  }
}

const _descriptor_10 = new _JubjubSchnorrHashInput_0();

class _tuple_1 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_0.alignment());
  }
  fromValue(value_0) {
    return [
      _descriptor_0.fromValue(value_0),
      _descriptor_0.fromValue(value_0)
    ]
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0[0]).concat(_descriptor_0.toValue(value_0[1]));
  }
}

const _descriptor_11 = new _tuple_1();

class _Either_0 {
  alignment() {
    return _descriptor_5.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_5.fromValue(value_0),
      left: _descriptor_0.fromValue(value_0),
      right: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_5.toValue(value_0.is_left).concat(_descriptor_0.toValue(value_0.left).concat(_descriptor_0.toValue(value_0.right)));
  }
}

const _descriptor_12 = new _Either_0();

const _descriptor_13 = new __compactRuntime.CompactTypeUnsignedInteger(340282366920938463463374607431768211455n, 16);

class _ContractAddress_0 {
  alignment() {
    return _descriptor_0.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.bytes);
  }
}

const _descriptor_14 = new _ContractAddress_0();

class _UserAddress_0 {
  alignment() {
    return _descriptor_0.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.bytes);
  }
}

const _descriptor_15 = new _UserAddress_0();

class _Either_1 {
  alignment() {
    return _descriptor_5.alignment().concat(_descriptor_14.alignment().concat(_descriptor_15.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_5.fromValue(value_0),
      left: _descriptor_14.fromValue(value_0),
      right: _descriptor_15.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_5.toValue(value_0.is_left).concat(_descriptor_14.toValue(value_0.left).concat(_descriptor_15.toValue(value_0.right)));
  }
}

const _descriptor_16 = new _Either_1();

class _Maybe_0 {
  alignment() {
    return _descriptor_5.alignment().concat(_descriptor_16.alignment());
  }
  fromValue(value_0) {
    return {
      is_some: _descriptor_5.fromValue(value_0),
      value: _descriptor_16.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_5.toValue(value_0.is_some).concat(_descriptor_16.toValue(value_0.value));
  }
}

const _descriptor_17 = new _Maybe_0();

const _descriptor_18 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

const _descriptor_19 = new __compactRuntime.CompactTypeUnsignedInteger(4294967295n, 4);

export class Contract {
  witnesses;
  constructor(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract constructor: expected 1 argument, received ${args_0.length}`);
    }
    const witnesses_0 = args_0[0];
    if (typeof(witnesses_0) !== 'object') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
    }
    if (typeof(witnesses_0.name_secret) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named name_secret');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      async name_owner_key(context, ...args_1) {
        return { result: pureCircuits.name_owner_key(...args_1), context };
      },
      async attestation_message(context, ...args_1) {
        return { result: pureCircuits.attestation_message(...args_1), context };
      },
      async email_attestation_message(context, ...args_1) {
        return { result: pureCircuits.email_attestation_message(...args_1), context };
      },
      register_name: async (...args_1) => {
        if (args_1.length !== 4) {
          throw new __compactRuntime.CompactError(`register_name: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const name_0 = args_1[1];
        const tip_pk_0 = args_1[2];
        const enc_pk_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('register_name',
                                     'argument 1 (as invoked from Typescript)',
                                     'night_registry.compact line 71 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(name_0.buffer instanceof ArrayBuffer && name_0.BYTES_PER_ELEMENT === 1 && name_0.length === 32)) {
          __compactRuntime.typeError('register_name',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'night_registry.compact line 71 char 1',
                                     'Bytes<32>',
                                     name_0)
        }
        if (!(typeof(tip_pk_0) === 'bigint' && tip_pk_0 >= 0 && tip_pk_0 <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('register_name',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'night_registry.compact line 71 char 1',
                                     'Field',
                                     tip_pk_0)
        }
        if (!(enc_pk_0.buffer instanceof ArrayBuffer && enc_pk_0.BYTES_PER_ELEMENT === 1 && enc_pk_0.length === 32)) {
          __compactRuntime.typeError('register_name',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'night_registry.compact line 71 char 1',
                                     'Bytes<32>',
                                     enc_pk_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(name_0).concat(_descriptor_2.toValue(tip_pk_0).concat(_descriptor_0.toValue(enc_pk_0))),
            alignment: _descriptor_0.alignment().concat(_descriptor_2.alignment().concat(_descriptor_0.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._register_name_0(context,
                                                     partialProofData,
                                                     name_0,
                                                     tip_pk_0,
                                                     enc_pk_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      update_keys: async (...args_1) => {
        if (args_1.length !== 4) {
          throw new __compactRuntime.CompactError(`update_keys: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const name_0 = args_1[1];
        const tip_pk_0 = args_1[2];
        const enc_pk_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('update_keys',
                                     'argument 1 (as invoked from Typescript)',
                                     'night_registry.compact line 87 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(name_0.buffer instanceof ArrayBuffer && name_0.BYTES_PER_ELEMENT === 1 && name_0.length === 32)) {
          __compactRuntime.typeError('update_keys',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'night_registry.compact line 87 char 1',
                                     'Bytes<32>',
                                     name_0)
        }
        if (!(typeof(tip_pk_0) === 'bigint' && tip_pk_0 >= 0 && tip_pk_0 <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('update_keys',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'night_registry.compact line 87 char 1',
                                     'Field',
                                     tip_pk_0)
        }
        if (!(enc_pk_0.buffer instanceof ArrayBuffer && enc_pk_0.BYTES_PER_ELEMENT === 1 && enc_pk_0.length === 32)) {
          __compactRuntime.typeError('update_keys',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'night_registry.compact line 87 char 1',
                                     'Bytes<32>',
                                     enc_pk_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(name_0).concat(_descriptor_2.toValue(tip_pk_0).concat(_descriptor_0.toValue(enc_pk_0))),
            alignment: _descriptor_0.alignment().concat(_descriptor_2.alignment().concat(_descriptor_0.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._update_keys_0(context,
                                                   partialProofData,
                                                   name_0,
                                                   tip_pk_0,
                                                   enc_pk_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      link_social: async (...args_1) => {
        if (args_1.length !== 4) {
          throw new __compactRuntime.CompactError(`link_social: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const name_0 = args_1[1];
        const social_0 = args_1[2];
        const sig_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('link_social',
                                     'argument 1 (as invoked from Typescript)',
                                     'night_registry.compact line 100 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(name_0.buffer instanceof ArrayBuffer && name_0.BYTES_PER_ELEMENT === 1 && name_0.length === 32)) {
          __compactRuntime.typeError('link_social',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'night_registry.compact line 100 char 1',
                                     'Bytes<32>',
                                     name_0)
        }
        if (!(social_0.buffer instanceof ArrayBuffer && social_0.BYTES_PER_ELEMENT === 1 && social_0.length === 32)) {
          __compactRuntime.typeError('link_social',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'night_registry.compact line 100 char 1',
                                     'Bytes<32>',
                                     social_0)
        }
        if (!(typeof(sig_0) === 'object' && typeof(sig_0.announcement.x) === 'bigint' && sig_0.announcement.x >= 0n && sig_0.announcement.x <= __compactRuntime.MAX_FIELD && typeof(sig_0.announcement.y) === 'bigint' && sig_0.announcement.y >= 0n && sig_0.announcement.y <= __compactRuntime.MAX_FIELD && typeof(sig_0.response) === 'bigint' && sig_0.response >= 0 && sig_0.response <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('link_social',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'night_registry.compact line 100 char 1',
                                     'struct JubjubSchnorrSignature<announcement: JubjubPoint, response: Field>',
                                     sig_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(name_0).concat(_descriptor_0.toValue(social_0).concat(_descriptor_6.toValue(sig_0))),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_6.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._link_social_0(context,
                                                   partialProofData,
                                                   name_0,
                                                   social_0,
                                                   sig_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      unlink_social: async (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`unlink_social: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const name_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('unlink_social',
                                     'argument 1 (as invoked from Typescript)',
                                     'night_registry.compact line 139 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(name_0.buffer instanceof ArrayBuffer && name_0.BYTES_PER_ELEMENT === 1 && name_0.length === 32)) {
          __compactRuntime.typeError('unlink_social',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'night_registry.compact line 139 char 1',
                                     'Bytes<32>',
                                     name_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(name_0),
            alignment: _descriptor_0.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._unlink_social_0(context,
                                                     partialProofData,
                                                     name_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      link_email: async (...args_1) => {
        if (args_1.length !== 4) {
          throw new __compactRuntime.CompactError(`link_email: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const name_0 = args_1[1];
        const email_hash_0 = args_1[2];
        const sig_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('link_email',
                                     'argument 1 (as invoked from Typescript)',
                                     'night_registry.compact line 152 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(name_0.buffer instanceof ArrayBuffer && name_0.BYTES_PER_ELEMENT === 1 && name_0.length === 32)) {
          __compactRuntime.typeError('link_email',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'night_registry.compact line 152 char 1',
                                     'Bytes<32>',
                                     name_0)
        }
        if (!(email_hash_0.buffer instanceof ArrayBuffer && email_hash_0.BYTES_PER_ELEMENT === 1 && email_hash_0.length === 32)) {
          __compactRuntime.typeError('link_email',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'night_registry.compact line 152 char 1',
                                     'Bytes<32>',
                                     email_hash_0)
        }
        if (!(typeof(sig_0) === 'object' && typeof(sig_0.announcement.x) === 'bigint' && sig_0.announcement.x >= 0n && sig_0.announcement.x <= __compactRuntime.MAX_FIELD && typeof(sig_0.announcement.y) === 'bigint' && sig_0.announcement.y >= 0n && sig_0.announcement.y <= __compactRuntime.MAX_FIELD && typeof(sig_0.response) === 'bigint' && sig_0.response >= 0 && sig_0.response <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('link_email',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'night_registry.compact line 152 char 1',
                                     'struct JubjubSchnorrSignature<announcement: JubjubPoint, response: Field>',
                                     sig_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(name_0).concat(_descriptor_0.toValue(email_hash_0).concat(_descriptor_6.toValue(sig_0))),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_6.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._link_email_0(context,
                                                  partialProofData,
                                                  name_0,
                                                  email_hash_0,
                                                  sig_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      unlink_email: async (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`unlink_email: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const name_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('unlink_email',
                                     'argument 1 (as invoked from Typescript)',
                                     'night_registry.compact line 191 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(name_0.buffer instanceof ArrayBuffer && name_0.BYTES_PER_ELEMENT === 1 && name_0.length === 32)) {
          __compactRuntime.typeError('unlink_email',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'night_registry.compact line 191 char 1',
                                     'Bytes<32>',
                                     name_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(name_0),
            alignment: _descriptor_0.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._unlink_email_0(context,
                                                    partialProofData,
                                                    name_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      }
    };
    this.impureCircuits = {
      register_name: this.circuits.register_name,
      update_keys: this.circuits.update_keys,
      link_social: this.circuits.link_social,
      unlink_social: this.circuits.unlink_social,
      link_email: this.circuits.link_email,
      unlink_email: this.circuits.unlink_email
    };
    this.provableCircuits = {
      register_name: this.circuits.register_name,
      update_keys: this.circuits.update_keys,
      link_social: this.circuits.link_social,
      unlink_social: this.circuits.unlink_social,
      link_email: this.circuits.link_email,
      unlink_email: this.circuits.unlink_email
    };
  }
  async initialState(...args_0) {
    if (args_0.length !== 2) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 2 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const constructorContext_0 = args_0[0];
    const attester_pk_0 = args_0[1];
    if (typeof(constructorContext_0) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!('initialPrivateState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialPrivateState' in argument 1 (as invoked from Typescript)`);
    }
    if (!('initialZswapLocalState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)`);
    }
    if (typeof(constructorContext_0.initialZswapLocalState) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!(typeof(attester_pk_0.x) === 'bigint' && attester_pk_0.x >= 0n && attester_pk_0.x <= __compactRuntime.MAX_FIELD && typeof(attester_pk_0.y) === 'bigint' && attester_pk_0.y >= 0n && attester_pk_0.y <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 1 (argument 2 as invoked from Typescript)',
                                 'night_registry.compact line 41 char 1',
                                 'JubjubPoint',
                                 attester_pk_0)
    }
    const state_0 = new __compactRuntime.ContractState();
    let stateValue_0 = __compactRuntime.StateValue.newArray();
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    state_0.data = new __compactRuntime.ChargedState(stateValue_0);
    state_0.setOperation('register_name', new __compactRuntime.ContractOperation());
    state_0.setOperation('update_keys', new __compactRuntime.ContractOperation());
    state_0.setOperation('link_social', new __compactRuntime.ContractOperation());
    state_0.setOperation('unlink_social', new __compactRuntime.ContractOperation());
    state_0.setOperation('link_email', new __compactRuntime.ContractOperation());
    state_0.setOperation('unlink_email', new __compactRuntime.ContractOperation());
    const context = __compactRuntime.createCircuitContext({circuitId: 'constructor', contractAddress: __compactRuntime.dummyContractAddress(), coinPublicKeyOrZswapState: constructorContext_0.initialZswapLocalState.coinPublicKey, contractState: state_0.data, privateState: constructorContext_0.initialPrivateState});
    const partialProofData = {
      input: { value: [], alignment: [] },
      output: undefined,
      publicTranscript: [],
      privateTranscriptOutputs: []
    };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(0n),
                                                                                              alignment: _descriptor_18.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(1n),
                                                                                              alignment: _descriptor_18.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(2n),
                                                                                              alignment: _descriptor_18.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(3n),
                                                                                              alignment: _descriptor_18.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(4n),
                                                                                              alignment: _descriptor_18.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(({x: 0n, y: 1n})),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(4n),
                                                                                              alignment: _descriptor_18.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(attester_pk_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    const tmp_0 = 0n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(3n),
                                                                                              alignment: _descriptor_18.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(tmp_0),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    state_0.data = new __compactRuntime.ChargedState(context.callContext.currentQueryContext.state.state);
    return {
      currentContractState: state_0,
      currentPrivateState: context.callContext.currentPrivateState,
      currentZswapLocalState: context.callContext.currentZswapLocalState
    }
  }
  _jubjubSchnorrVerify_0(msg_0, signature_0, pk_0) {
    __compactRuntime.assert(!this._equal_0(pk_0, ({x: 0n, y: 1n})),
                            'JubjubPoint identity is not a permitted jubjubSchnorrVerify verification key');
    const __compact_pattern_tmp1_0 = signature_0;
    const announcement_0 = __compact_pattern_tmp1_0.announcement;
    const response_0 = __compact_pattern_tmp1_0.response;
    const cNative_0 = this._transientHash_2({ annX:
                                                this._jubjubPointX_0(announcement_0),
                                              annY:
                                                this._jubjubPointY_0(announcement_0),
                                              pkX: this._jubjubPointX_0(pk_0),
                                              pkY: this._jubjubPointY_0(pk_0),
                                              msg: msg_0 });
    const c_0 = __compactRuntime.convertNumericToJubjubScalar(cNative_0);
    const lhs_0 = this._ecMulGenerator_0(__compactRuntime.convertNumericToJubjubScalar(response_0));
    const rhs_0 = this._ecAdd_0(announcement_0, this._ecMul_0(pk_0, c_0));
    return this._equal_1(lhs_0, rhs_0);
  }
  _transientHash_0(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_11, value_0);
    return result_0;
  }
  _transientHash_1(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_8, value_0);
    return result_0;
  }
  _transientHash_2(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_10, value_0);
    return result_0;
  }
  _jubjubPointX_0(pt_0) {
    const result_0 = __compactRuntime.jubjubPointX(pt_0);
    return result_0;
  }
  _jubjubPointY_0(pt_0) {
    const result_0 = __compactRuntime.jubjubPointY(pt_0);
    return result_0;
  }
  _ecAdd_0(a_0, b_0) {
    const result_0 = __compactRuntime.ecAdd(a_0, b_0);
    return result_0;
  }
  _ecMul_0(a_0, b_0) {
    const result_0 = __compactRuntime.ecMul(a_0, b_0);
    return result_0;
  }
  _ecMulGenerator_0(b_0) {
    const result_0 = __compactRuntime.ecMulGenerator(b_0);
    return result_0;
  }
  _name_secret_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.callContext.currentQueryContext.state), context.callContext.currentPrivateState, context.callContext.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.name_secret(witnessContext_0);
    context.callContext.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('name_secret',
                                 'return value',
                                 'night_registry.compact line 39 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _name_owner_key_0(sk_0) {
    return this._transientHash_0([new Uint8Array([104, 117, 115, 104, 104, 58, 110, 97, 109, 101, 45, 111, 119, 110, 101, 114, 58, 118, 49, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                  sk_0]);
  }
  _attestation_message_0(social_0, name_0) {
    return this._transientHash_1([new Uint8Array([104, 117, 115, 104, 104, 58, 115, 111, 99, 105, 97, 108, 45, 97, 116, 116, 101, 115, 116, 58, 118, 49, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                  social_0,
                                  name_0]);
  }
  _email_attestation_message_0(email_hash_0, name_0) {
    return this._transientHash_1([new Uint8Array([104, 117, 115, 104, 104, 58, 101, 109, 97, 105, 108, 45, 97, 116, 116, 101, 115, 116, 58, 118, 49, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                  email_hash_0,
                                  name_0]);
  }
  async _require_owner_0(context, partialProofData, name_0) {
    __compactRuntime.assert(_descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_18.toValue(0n),
                                                                                                                  alignment: _descriptor_18.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(name_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'unknown name');
    const r_0 = _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_18.toValue(0n),
                                                                                                      alignment: _descriptor_18.alignment() } }] } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_0.toValue(name_0),
                                                                                                      alignment: _descriptor_0.alignment() } }] } },
                                                                           { popeq: { cached: false,
                                                                                      result: undefined } }]).value);
    __compactRuntime.assert(r_0.owner
                            ===
                            this._name_owner_key_0(this._name_secret_0(context,
                                                                       partialProofData)),
                            'not the name owner');
    return r_0;
  }
  async _register_name_0(context, partialProofData, name_0, tip_pk_0, enc_pk_0)
  {
    const n_0 = name_0;
    __compactRuntime.assert(!this._equal_2(n_0, new Uint8Array(32)),
                            'empty name');
    __compactRuntime.assert(!_descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_18.toValue(0n),
                                                                                                                   alignment: _descriptor_18.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(n_0),
                                                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'name already taken');
    const tmp_0 = { owner:
                      this._name_owner_key_0(this._name_secret_0(context,
                                                                 partialProofData)),
                    tip_pk: tip_pk_0,
                    enc_pk: enc_pk_0,
                    social: new Uint8Array(32),
                    email: new Uint8Array(32),
                    index:
                      _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                partialProofData,
                                                                                [
                                                                                 { dup: { n: 0 } },
                                                                                 { idx: { cached: false,
                                                                                          pushPath: false,
                                                                                          path: [
                                                                                                 { tag: 'value',
                                                                                                   value: { value: _descriptor_18.toValue(3n),
                                                                                                            alignment: _descriptor_18.alignment() } }] } },
                                                                                 { popeq: { cached: false,
                                                                                            result: undefined } }]).value) };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_18.toValue(0n),
                                                                  alignment: _descriptor_18.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(n_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(tmp_0),
                                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_1 = ((t1) => {
                    if (t1 > 18446744073709551615n) {
                      throw new __compactRuntime.CompactError('night_registry.compact line 83 char 16: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                    }
                    return t1;
                  })(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_18.toValue(3n),
                                                                                                           alignment: _descriptor_18.alignment() } }] } },
                                                                                { popeq: { cached: false,
                                                                                           result: undefined } }]).value)
                     +
                     1n);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(3n),
                                                                                              alignment: _descriptor_18.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(tmp_1),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    return [];
  }
  async _update_keys_0(context, partialProofData, name_0, tip_pk_0, enc_pk_0) {
    const n_0 = name_0;
    const r_0 = await this._require_owner_0(context, partialProofData, n_0);
    const tmp_0 = { owner: r_0.owner,
                    tip_pk: tip_pk_0,
                    enc_pk: enc_pk_0,
                    social: r_0.social,
                    email: r_0.email,
                    index: r_0.index };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_18.toValue(0n),
                                                                  alignment: _descriptor_18.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(n_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(tmp_0),
                                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  async _link_social_0(context, partialProofData, name_0, social_0, sig_0) {
    const n_0 = name_0;
    const s_0 = social_0;
    __compactRuntime.assert(!this._equal_3(s_0, new Uint8Array(32)),
                            'empty social id');
    const r_0 = await this._require_owner_0(context, partialProofData, n_0);
    const msg_0 = [this._attestation_message_0(s_0, n_0)];
    __compactRuntime.assert(this._jubjubSchnorrVerify_0(msg_0,
                                                        sig_0,
                                                        _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                                  partialProofData,
                                                                                                                  [
                                                                                                                   { dup: { n: 0 } },
                                                                                                                   { idx: { cached: false,
                                                                                                                            pushPath: false,
                                                                                                                            path: [
                                                                                                                                   { tag: 'value',
                                                                                                                                     value: { value: _descriptor_18.toValue(4n),
                                                                                                                                              alignment: _descriptor_18.alignment() } }] } },
                                                                                                                   { popeq: { cached: false,
                                                                                                                              result: undefined } }]).value)),
                            'bad attestation');
    if (_descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                  partialProofData,
                                                                  [
                                                                   { dup: { n: 0 } },
                                                                   { idx: { cached: false,
                                                                            pushPath: false,
                                                                            path: [
                                                                                   { tag: 'value',
                                                                                     value: { value: _descriptor_18.toValue(1n),
                                                                                              alignment: _descriptor_18.alignment() } }] } },
                                                                   { push: { storage: false,
                                                                             value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(s_0),
                                                                                                                          alignment: _descriptor_0.alignment() }).encode() } },
                                                                   'member',
                                                                   { popeq: { cached: true,
                                                                              result: undefined } }]).value))
    {
      const prev_0 = _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_18.toValue(1n),
                                                                                                           alignment: _descriptor_18.alignment() } }] } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_0.toValue(s_0),
                                                                                                           alignment: _descriptor_0.alignment() } }] } },
                                                                                { popeq: { cached: false,
                                                                                           result: undefined } }]).value);
      if (!this._equal_4(prev_0, n_0)) {
        if (_descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                      partialProofData,
                                                                      [
                                                                       { dup: { n: 0 } },
                                                                       { idx: { cached: false,
                                                                                pushPath: false,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_18.toValue(0n),
                                                                                                  alignment: _descriptor_18.alignment() } }] } },
                                                                       { push: { storage: false,
                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(prev_0),
                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                       'member',
                                                                       { popeq: { cached: true,
                                                                                  result: undefined } }]).value))
        {
          const p_0 = _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                partialProofData,
                                                                                [
                                                                                 { dup: { n: 0 } },
                                                                                 { idx: { cached: false,
                                                                                          pushPath: false,
                                                                                          path: [
                                                                                                 { tag: 'value',
                                                                                                   value: { value: _descriptor_18.toValue(0n),
                                                                                                            alignment: _descriptor_18.alignment() } }] } },
                                                                                 { idx: { cached: false,
                                                                                          pushPath: false,
                                                                                          path: [
                                                                                                 { tag: 'value',
                                                                                                   value: { value: _descriptor_0.toValue(prev_0),
                                                                                                            alignment: _descriptor_0.alignment() } }] } },
                                                                                 { popeq: { cached: false,
                                                                                            result: undefined } }]).value);
          const tmp_0 = { owner: p_0.owner,
                          tip_pk: p_0.tip_pk,
                          enc_pk: p_0.enc_pk,
                          social: new Uint8Array(32),
                          email: p_0.email,
                          index: p_0.index };
          __compactRuntime.queryLedgerState(context,
                                            partialProofData,
                                            [
                                             { idx: { cached: false,
                                                      pushPath: true,
                                                      path: [
                                                             { tag: 'value',
                                                               value: { value: _descriptor_18.toValue(0n),
                                                                        alignment: _descriptor_18.alignment() } }] } },
                                             { push: { storage: false,
                                                       value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(prev_0),
                                                                                                    alignment: _descriptor_0.alignment() }).encode() } },
                                             { push: { storage: true,
                                                       value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(tmp_0),
                                                                                                    alignment: _descriptor_4.alignment() }).encode() } },
                                             { ins: { cached: false, n: 1 } },
                                             { ins: { cached: true, n: 1 } }]);
        }
      }
    }
    if (!this._equal_5(r_0.social, new Uint8Array(32))) {
      if (!this._equal_6(r_0.social, s_0)) {
        const tmp_1 = r_0.social;
        __compactRuntime.queryLedgerState(context,
                                          partialProofData,
                                          [
                                           { idx: { cached: false,
                                                    pushPath: true,
                                                    path: [
                                                           { tag: 'value',
                                                             value: { value: _descriptor_18.toValue(1n),
                                                                      alignment: _descriptor_18.alignment() } }] } },
                                           { push: { storage: false,
                                                     value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_1),
                                                                                                  alignment: _descriptor_0.alignment() }).encode() } },
                                           { rem: { cached: false } },
                                           { ins: { cached: true, n: 1 } }]);
      }
    }
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_18.toValue(1n),
                                                                  alignment: _descriptor_18.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(s_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(n_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_2 = { owner: r_0.owner,
                    tip_pk: r_0.tip_pk,
                    enc_pk: r_0.enc_pk,
                    social: s_0,
                    email: r_0.email,
                    index: r_0.index };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_18.toValue(0n),
                                                                  alignment: _descriptor_18.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(n_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(tmp_2),
                                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  async _unlink_social_0(context, partialProofData, name_0) {
    const n_0 = name_0;
    const r_0 = await this._require_owner_0(context, partialProofData, n_0);
    __compactRuntime.assert(!this._equal_7(r_0.social, new Uint8Array(32)),
                            'no social linked');
    const tmp_0 = r_0.social;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_18.toValue(1n),
                                                                  alignment: _descriptor_18.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { rem: { cached: false } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_1 = { owner: r_0.owner,
                    tip_pk: r_0.tip_pk,
                    enc_pk: r_0.enc_pk,
                    social: new Uint8Array(32),
                    email: r_0.email,
                    index: r_0.index };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_18.toValue(0n),
                                                                  alignment: _descriptor_18.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(n_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(tmp_1),
                                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  async _link_email_0(context, partialProofData, name_0, email_hash_0, sig_0) {
    const n_0 = name_0;
    const e_0 = email_hash_0;
    __compactRuntime.assert(!this._equal_8(e_0, new Uint8Array(32)),
                            'empty email');
    const r_0 = await this._require_owner_0(context, partialProofData, n_0);
    const msg_0 = [this._email_attestation_message_0(e_0, n_0)];
    __compactRuntime.assert(this._jubjubSchnorrVerify_0(msg_0,
                                                        sig_0,
                                                        _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                                  partialProofData,
                                                                                                                  [
                                                                                                                   { dup: { n: 0 } },
                                                                                                                   { idx: { cached: false,
                                                                                                                            pushPath: false,
                                                                                                                            path: [
                                                                                                                                   { tag: 'value',
                                                                                                                                     value: { value: _descriptor_18.toValue(4n),
                                                                                                                                              alignment: _descriptor_18.alignment() } }] } },
                                                                                                                   { popeq: { cached: false,
                                                                                                                              result: undefined } }]).value)),
                            'bad attestation');
    if (_descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                  partialProofData,
                                                                  [
                                                                   { dup: { n: 0 } },
                                                                   { idx: { cached: false,
                                                                            pushPath: false,
                                                                            path: [
                                                                                   { tag: 'value',
                                                                                     value: { value: _descriptor_18.toValue(2n),
                                                                                              alignment: _descriptor_18.alignment() } }] } },
                                                                   { push: { storage: false,
                                                                             value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(e_0),
                                                                                                                          alignment: _descriptor_0.alignment() }).encode() } },
                                                                   'member',
                                                                   { popeq: { cached: true,
                                                                              result: undefined } }]).value))
    {
      const prev_0 = _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_18.toValue(2n),
                                                                                                           alignment: _descriptor_18.alignment() } }] } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_0.toValue(e_0),
                                                                                                           alignment: _descriptor_0.alignment() } }] } },
                                                                                { popeq: { cached: false,
                                                                                           result: undefined } }]).value);
      if (!this._equal_9(prev_0, n_0)) {
        if (_descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                      partialProofData,
                                                                      [
                                                                       { dup: { n: 0 } },
                                                                       { idx: { cached: false,
                                                                                pushPath: false,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_18.toValue(0n),
                                                                                                  alignment: _descriptor_18.alignment() } }] } },
                                                                       { push: { storage: false,
                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(prev_0),
                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                       'member',
                                                                       { popeq: { cached: true,
                                                                                  result: undefined } }]).value))
        {
          const p_0 = _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                partialProofData,
                                                                                [
                                                                                 { dup: { n: 0 } },
                                                                                 { idx: { cached: false,
                                                                                          pushPath: false,
                                                                                          path: [
                                                                                                 { tag: 'value',
                                                                                                   value: { value: _descriptor_18.toValue(0n),
                                                                                                            alignment: _descriptor_18.alignment() } }] } },
                                                                                 { idx: { cached: false,
                                                                                          pushPath: false,
                                                                                          path: [
                                                                                                 { tag: 'value',
                                                                                                   value: { value: _descriptor_0.toValue(prev_0),
                                                                                                            alignment: _descriptor_0.alignment() } }] } },
                                                                                 { popeq: { cached: false,
                                                                                            result: undefined } }]).value);
          const tmp_0 = { owner: p_0.owner,
                          tip_pk: p_0.tip_pk,
                          enc_pk: p_0.enc_pk,
                          social: p_0.social,
                          email: new Uint8Array(32),
                          index: p_0.index };
          __compactRuntime.queryLedgerState(context,
                                            partialProofData,
                                            [
                                             { idx: { cached: false,
                                                      pushPath: true,
                                                      path: [
                                                             { tag: 'value',
                                                               value: { value: _descriptor_18.toValue(0n),
                                                                        alignment: _descriptor_18.alignment() } }] } },
                                             { push: { storage: false,
                                                       value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(prev_0),
                                                                                                    alignment: _descriptor_0.alignment() }).encode() } },
                                             { push: { storage: true,
                                                       value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(tmp_0),
                                                                                                    alignment: _descriptor_4.alignment() }).encode() } },
                                             { ins: { cached: false, n: 1 } },
                                             { ins: { cached: true, n: 1 } }]);
        }
      }
    }
    if (!this._equal_10(r_0.email, new Uint8Array(32))) {
      if (!this._equal_11(r_0.email, e_0)) {
        const tmp_1 = r_0.email;
        __compactRuntime.queryLedgerState(context,
                                          partialProofData,
                                          [
                                           { idx: { cached: false,
                                                    pushPath: true,
                                                    path: [
                                                           { tag: 'value',
                                                             value: { value: _descriptor_18.toValue(2n),
                                                                      alignment: _descriptor_18.alignment() } }] } },
                                           { push: { storage: false,
                                                     value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_1),
                                                                                                  alignment: _descriptor_0.alignment() }).encode() } },
                                           { rem: { cached: false } },
                                           { ins: { cached: true, n: 1 } }]);
      }
    }
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_18.toValue(2n),
                                                                  alignment: _descriptor_18.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(e_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(n_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_2 = { owner: r_0.owner,
                    tip_pk: r_0.tip_pk,
                    enc_pk: r_0.enc_pk,
                    social: r_0.social,
                    email: e_0,
                    index: r_0.index };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_18.toValue(0n),
                                                                  alignment: _descriptor_18.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(n_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(tmp_2),
                                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  async _unlink_email_0(context, partialProofData, name_0) {
    const n_0 = name_0;
    const r_0 = await this._require_owner_0(context, partialProofData, n_0);
    __compactRuntime.assert(!this._equal_12(r_0.email, new Uint8Array(32)),
                            'no email linked');
    const tmp_0 = r_0.email;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_18.toValue(2n),
                                                                  alignment: _descriptor_18.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { rem: { cached: false } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_1 = { owner: r_0.owner,
                    tip_pk: r_0.tip_pk,
                    enc_pk: r_0.enc_pk,
                    social: r_0.social,
                    email: new Uint8Array(32),
                    index: r_0.index };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_18.toValue(0n),
                                                                  alignment: _descriptor_18.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(n_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(tmp_1),
                                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _equal_0(x0, y0) {
    if (x0.x != y0.x || x0.y != y0.y) {
      return false;
    }
    return true;
  }
  _equal_1(x0, y0) {
    if (x0.x != y0.x || x0.y != y0.y) {
      return false;
    }
    return true;
  }
  _equal_2(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_3(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_4(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_5(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_6(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_7(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_8(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_9(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_10(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_11(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_12(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
}
export function ledger(stateOrChargedState) {
  const state = stateOrChargedState instanceof __compactRuntime.StateValue ? stateOrChargedState : stateOrChargedState.state;
  const chargedState = stateOrChargedState instanceof __compactRuntime.StateValue ? new __compactRuntime.ChargedState(stateOrChargedState) : stateOrChargedState;
  const context = {
    callContext: { currentQueryContext: new __compactRuntime.QueryContext(chargedState, __compactRuntime.dummyContractAddress()), currentGasCost: __compactRuntime.emptyRunningCost() },
    costModel: __compactRuntime.CostModel.initialCostModel()
  };
  const partialProofData = {
    input: { value: [], alignment: [] },
    output: undefined,
    publicTranscript: [],
    privateTranscriptOutputs: []
  };
  return {
    names: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_18.toValue(0n),
                                                                                                     alignment: _descriptor_18.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                                                                 alignment: _descriptor_3.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_18.toValue(0n),
                                                                                                     alignment: _descriptor_18.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'night_registry.compact line 33 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_18.toValue(0n),
                                                                                                     alignment: _descriptor_18.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'night_registry.compact line 33 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_18.toValue(0n),
                                                                                                     alignment: _descriptor_18.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_0.toValue(key_0),
                                                                                                     alignment: _descriptor_0.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[0];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_4.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    socials: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_18.toValue(1n),
                                                                                                     alignment: _descriptor_18.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                                                                 alignment: _descriptor_3.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_18.toValue(1n),
                                                                                                     alignment: _descriptor_18.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'night_registry.compact line 34 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_18.toValue(1n),
                                                                                                     alignment: _descriptor_18.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'night_registry.compact line 34 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_18.toValue(1n),
                                                                                                     alignment: _descriptor_18.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_0.toValue(key_0),
                                                                                                     alignment: _descriptor_0.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[1];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_0.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    emails: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_18.toValue(2n),
                                                                                                     alignment: _descriptor_18.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                                                                 alignment: _descriptor_3.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_18.toValue(2n),
                                                                                                     alignment: _descriptor_18.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'night_registry.compact line 35 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_18.toValue(2n),
                                                                                                     alignment: _descriptor_18.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'night_registry.compact line 35 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_18.toValue(2n),
                                                                                                     alignment: _descriptor_18.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_0.toValue(key_0),
                                                                                                     alignment: _descriptor_0.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[2];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_0.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    get name_count() {
      return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_18.toValue(3n),
                                                                                                   alignment: _descriptor_18.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    get attester() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_18.toValue(4n),
                                                                                                   alignment: _descriptor_18.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    }
  };
}
const _emptyContext = {
  callContext: { currentQueryContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress()), currentGasCost: __compactRuntime.emptyRunningCost() }
};
const _dummyContract = new Contract({ name_secret: (...args) => undefined });
export const pureCircuits = {
  name_owner_key: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`name_owner_key: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const sk_0 = args_0[0];
    if (!(sk_0.buffer instanceof ArrayBuffer && sk_0.BYTES_PER_ELEMENT === 1 && sk_0.length === 32)) {
      __compactRuntime.typeError('name_owner_key',
                                 'argument 1',
                                 'night_registry.compact line 46 char 1',
                                 'Bytes<32>',
                                 sk_0)
    }
    return _dummyContract._name_owner_key_0(sk_0);
  },
  attestation_message: (...args_0) => {
    if (args_0.length !== 2) {
      throw new __compactRuntime.CompactError(`attestation_message: expected 2 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const social_0 = args_0[0];
    const name_0 = args_0[1];
    if (!(social_0.buffer instanceof ArrayBuffer && social_0.BYTES_PER_ELEMENT === 1 && social_0.length === 32)) {
      __compactRuntime.typeError('attestation_message',
                                 'argument 1',
                                 'night_registry.compact line 51 char 1',
                                 'Bytes<32>',
                                 social_0)
    }
    if (!(name_0.buffer instanceof ArrayBuffer && name_0.BYTES_PER_ELEMENT === 1 && name_0.length === 32)) {
      __compactRuntime.typeError('attestation_message',
                                 'argument 2',
                                 'night_registry.compact line 51 char 1',
                                 'Bytes<32>',
                                 name_0)
    }
    return _dummyContract._attestation_message_0(social_0, name_0);
  },
  email_attestation_message: (...args_0) => {
    if (args_0.length !== 2) {
      throw new __compactRuntime.CompactError(`email_attestation_message: expected 2 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const email_hash_0 = args_0[0];
    const name_0 = args_0[1];
    if (!(email_hash_0.buffer instanceof ArrayBuffer && email_hash_0.BYTES_PER_ELEMENT === 1 && email_hash_0.length === 32)) {
      __compactRuntime.typeError('email_attestation_message',
                                 'argument 1',
                                 'night_registry.compact line 58 char 1',
                                 'Bytes<32>',
                                 email_hash_0)
    }
    if (!(name_0.buffer instanceof ArrayBuffer && name_0.BYTES_PER_ELEMENT === 1 && name_0.length === 32)) {
      __compactRuntime.typeError('email_attestation_message',
                                 'argument 2',
                                 'night_registry.compact line 58 char 1',
                                 'Bytes<32>',
                                 name_0)
    }
    return _dummyContract._email_attestation_message_0(email_hash_0, name_0);
  }
};
export const expectedVk = {
  'link_email': '09edd9ab4a2dfc7ec88fad01e5db4d4179effd02ce5ef598538bbebdb95d2597',
  'link_social': '34543e5071ad4177eb3cdc883512b29784a05aea0ca0f223afc91705d7194851',
  'register_name': 'ebc5ddeb9824d9fa0b5c9f9c431c28a708c5fdea5aa27313ffe30781bd2089b6',
  'unlink_email': '03490da8f632908f908d436728aa044d3441ac248923cf472ce363adbdab4538',
  'unlink_social': '9b6cc9f6ea1266a33f1946b13548ab977acf50cc8d2fe716ca8c83b200f67deb',
  'update_keys': '539a4c5a1dc9f07a1e279314ecd54332c1a6edc7401397ebd4e5f0affa1f57e8',
};

export const circuitSignatures = {
  'name_owner_key': {pure: true, provable: false, argumentTypes: [{tag: 'Bytes', length: 32}], resultType: {tag: 'Field'}},
  'attestation_message': {pure: true, provable: false, argumentTypes: [{tag: 'Bytes', length: 32}, {tag: 'Bytes', length: 32}], resultType: {tag: 'Field'}},
  'email_attestation_message': {pure: true, provable: false, argumentTypes: [{tag: 'Bytes', length: 32}, {tag: 'Bytes', length: 32}], resultType: {tag: 'Field'}},
  'register_name': {pure: false, provable: true, argumentTypes: [{tag: 'Bytes', length: 32}, {tag: 'Field'}, {tag: 'Bytes', length: 32}], resultType: {tag: 'Tuple', types: []}},
  'update_keys': {pure: false, provable: true, argumentTypes: [{tag: 'Bytes', length: 32}, {tag: 'Field'}, {tag: 'Bytes', length: 32}], resultType: {tag: 'Tuple', types: []}},
  'link_social': {pure: false, provable: true, argumentTypes: [{tag: 'Bytes', length: 32}, {tag: 'Bytes', length: 32}, {tag: 'Struct', name: 'JubjubSchnorrSignature', elements: [{name: 'announcement', type: {tag: 'JubjubPoint'}}, {name: 'response', type: {tag: 'Field'}}]}], resultType: {tag: 'Tuple', types: []}},
  'unlink_social': {pure: false, provable: true, argumentTypes: [{tag: 'Bytes', length: 32}], resultType: {tag: 'Tuple', types: []}},
  'link_email': {pure: false, provable: true, argumentTypes: [{tag: 'Bytes', length: 32}, {tag: 'Bytes', length: 32}, {tag: 'Struct', name: 'JubjubSchnorrSignature', elements: [{name: 'announcement', type: {tag: 'JubjubPoint'}}, {name: 'response', type: {tag: 'Field'}}]}], resultType: {tag: 'Tuple', types: []}},
  'unlink_email': {pure: false, provable: true, argumentTypes: [{tag: 'Bytes', length: 32}], resultType: {tag: 'Tuple', types: []}},
};

export const declaredInterfaces = {};

//# sourceMappingURL=index.js.map
