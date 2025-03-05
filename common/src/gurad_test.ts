import { GuardMaker, Guard, MODULES, OperatorType, Protocol,
    Passport, ValueType, ContextType, GuardParser, GuardObject,
    PassportQuery} from 'wowok';

export const test_guard_launch_creator_equal = async(protocol:Protocol, param:any) => {
    let permission_id1 = param.get('permission::Permission')[0];
    let permission_id2 = param.get('permission::Permission')[1];

    let maker = new GuardMaker();
    maker.add_query(MODULES.permission, 'Owner', permission_id1); // permission1 builder
    maker.add_query(MODULES.permission, 'Owner', permission_id2); // permission2 builder
    maker.add_logic(OperatorType.TYPE_LOGIC_EQUAL); // equal

    const sense1 = maker.build() ;
    Guard.New(protocol.sessionCurrent(), 'two permissions\' creator equal', sense1).launch(); // guard1
}

export const test_guard_launch_everyone = async(protocol:Protocol, param:any) => {
    Guard.everyone_guard(protocol.sessionCurrent())
}

export const test_guard_launch_substring = async(protocol:Protocol, param:any) => {
    let maker = new GuardMaker();
    maker.add_param(ValueType.TYPE_VEC_U8, "i love WOWOK"); 
    maker.add_param(ValueType.TYPE_VEC_U8, "WOWOK"); 
    maker.add_logic(OperatorType.TYPE_LOGIC_HAS_SUBSTRING); // substring
    const sense1 = maker.build() ;
    Guard.New(protocol.sessionCurrent(), 'sub string', sense1).launch()
}

export const test_guard_future_object = async(protocol:Protocol, param:any) => {
    let permission =  param.get('permission::Permission') ? param.get('permission::Permission')[0] : undefined;
    let machine = param.get('machine::Machine')? param.get('machine::Machine')[0] : undefined;
    if (!machine || !permission) {
        console.log('test_future_object machine undefined');
        return 
    }

    let maker = new GuardMaker();
    let id_progress = maker.add_constant(ValueType.TYPE_ADDRESS); // witness
    let id_machine = maker.add_constant(ValueType.TYPE_ADDRESS, machine);
    /*maker = maker.add_query(MODULES.progress, 'Has Parent', id_progress)
                .add_logic(OperatorType.TYPE_LOGIC_NOT)
                .add_query(MODULES.progress, 'Machine', id_progress)
                .add_param(ContextType.TYPE_CONSTANT, id_machine)
                .add_logic(OperatorType.TYPE_LOGIC_EQUAL)
                .add_logic(OperatorType.TYPE_LOGIC_AND)
                .build();// BE FALSE*/
    maker = maker.add_query(MODULES.progress, 'Machine', id_progress)
            .add_param(ContextType.TYPE_CONSTANT, id_machine)
            .add_logic(OperatorType.TYPE_LOGIC_EQUAL)
            .build()
/*
    let maker2 = new GuardMaker();
    identifer = maker2.add_constant(ValueType.TYPE_ADDRESS);
    maker2 = maker2.add_param(ContextType.TYPE_CONSTANT, identifer) // witness
            .add_query(MODULES.permission, 'Owner', permission)
            .add_logic(OperatorType.TYPE_LOGIC_EQUAL) // machine's  futrue progress-id equals permission's builder[always false]
            .add_query(MODULES.progress, 'Machine', identifer)
            .add_param(ValueType.TYPE_ADDRESS, machine)
            .add_logic(OperatorType.TYPE_LOGIC_EQUAL)
            .add_logic(OperatorType.TYPE_LOGIC_AND)
            .build(); // BE TRUE: !(machine object's progress id == permission object's builder)
*/
    // launch 2 guards
    Guard.New(protocol.sessionCurrent(), 'future progress has parent?', maker).launch() // BE FALSE
    Guard.New(protocol.sessionCurrent(), 'future progress has parent?', maker).launch() // BE FALSE
  /*  Guard.New(protocol.sessionCurrent(), 'future progress has parent? OR !(machine object\'s progress id == permission object\'s builder)', 
        maker.combine(maker2, false)).launch() // BE TRUE: sense(FALSE) or sense2(TRUE) */
}

export const test_guard_to_object = async (protocol:Protocol, param:any) =>  {
    let g1 = param.get('guard::Guard')?  param.get('guard::Guard')[0] : undefined;
    let g2 = param.get('guard::Guard')?  param.get('guard::Guard')[1] : undefined;

    if (g1) {
        let r = await GuardParser.DeGuardObject(protocol, g1);
        //console.log(JSON.stringify(r.object, null , 2));
        //console.log(r.constant);
    }
    if (g2) {
        let r = await GuardParser.DeGuardObject(protocol, g2);
        //console.log(JSON.stringify(r.object, null , 2));
        //console.log(r.constant);
    }
}

export const passport_query = async(param:Map<string, string[]>) : Promise<PassportQuery | undefined> => {
    let g1 = param.get('guard::Guard')?  param.get('guard::Guard')![0] : undefined;
    let g2 = param.get('guard::Guard')?  param.get('guard::Guard')![1] : undefined;

    let progress = param.get('progress::Progress')?  param.get('progress::Progress')![0] : undefined;
    if (!g1 || !g2  || !progress) {
        console.log('test_guard_passport guard undefined')
        return 
    }

    let parser = await GuardParser.Create([g1, g2]);
    if (!parser) {
        console.log('test_guard_passport parser null');
        return 
    }

    const fill = parser.future_fills();
    fill.forEach((v) => v.witness = progress);
    let query = await parser.done(fill);

    if (!query) {
        console.log('test_guard_passport query null')
        return;
    }
    return query
}

export const test_guard_passport = async(protocol:Protocol, param:any) => {
    //protocol.sessionCurrent().setGasBudget(500000000); // increase gas budget
    // console.log(param)
    const passport = new Passport(protocol.sessionCurrent(), param as PassportQuery)
    passport.freeze()
}

export const test_guard_launch_number = async(protocol:Protocol, param:any) => {
    let permission_id1 = param.get('permission::Permission')[0];
    let maker = new GuardMaker();
    maker.add_query(MODULES.permission, 'Number of Entities', permission_id1); // entity address count
    maker.add_param(ValueType.TYPE_U64, 2); 
    maker.add_logic(OperatorType.TYPE_LOGIC_AS_U256_GREATER); // GREATER than 2
    const sense1 = maker.build();
    Guard.New(protocol.sessionCurrent(), 'entity adress count > 2', sense1).launch()
}


export const test_guard_launch_permission_builder = async(protocol:Protocol, param:any) => {
    let permission_id = param.get('permission::Permission')[0];

    let maker = new GuardMaker();
    maker.add_query(MODULES.permission, 'Owner', permission_id); // permission builder address
    maker.add_param(ContextType.TYPE_SIGNER); // signer
    maker.add_logic(OperatorType.TYPE_LOGIC_EQUAL); // SINGER MUST BE perssion_id's builder
    const sense1 = maker.build();
    Guard.New(protocol.sessionCurrent(), 'permission builder address equals singer address', sense1).launch()
}

export const test_constant_launch_creator_equal = async (protocol:Protocol, param:any) => {
    let permission_id1 = param.get('permission::Permission')[0];
    let permission_id2 = param.get('permission::Permission')[1];

    let maker = new GuardMaker();
    let id1 = maker.add_constant(ValueType.TYPE_ADDRESS, permission_id1);
    let id2 = maker.add_constant(ValueType.TYPE_ADDRESS, permission_id2);
    maker.add_query(MODULES.permission, 'Owner', id1); // permission1 builder
    maker.add_query(MODULES.permission, 'Owner', id2); // permission2 builder
    maker.add_logic(OperatorType.TYPE_LOGIC_EQUAL); // BE TRUE: equal

    let sense1 = maker.build(true) ; // BE FALSE: !(permission1 builder == permission2 builder)
    //console.log(sense1)
    Guard.New(protocol.sessionCurrent(), 'two permissions\' creator NOT equal', sense1).launch(); // BE FALSE: sense1 and sense1
}
