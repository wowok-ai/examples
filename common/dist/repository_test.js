import { Repository, Repository_Policy_Mode, ValueType, Bcs, RepositoryValueType } from 'wowok';
export const test_repository_launch = async (protocol, param) => {
    let permission_id = param.get('permission::Permission')[0];
    let r = Repository.New(protocol.sessionCurrent(), permission_id, 'test repository', Repository_Policy_Mode.POLICY_MODE_FREE);
    let data_order_number = { key: 'order number', data: [
            { address: '0xe386bb9e01b3528b75f3751ad8a1e418b207ad979fea364087deef5250a73d3f', bcsBytes: Bcs.getInstance().ser(ValueType.TYPE_VEC_U8, new TextEncoder().encode('abcd-efg-3128')) },
            //{address:'0xe8778267a777a5f4cc1df30c97fa788c5acb7905fab01e1a7429da622efe48a8', bcsBytes:Bcs.getInstance().ser(ValueType.TYPE_STRING, 'abcd-xyz-12222')},
        ], value_type: ValueType.TYPE_STRING };
    let data_order_time = { key: 'order time', data: [
            { address: '0xe386bb9e01b3528b75f3751ad8a1e418b207ad979fea364087deef5250a73d3f', bcsBytes: Bcs.getInstance().ser(ValueType.TYPE_U64, 0) },
            { address: '0x07b1e78a99dcb13d2f1411cab294c8a54c44f03f7ab97b0a1bdecec99e1a186c', bcsBytes: Bcs.getInstance().ser(ValueType.TYPE_U64, 1234675) },
        ], value_type: ValueType.TYPE_U64 };
    let data_order_ch = { key: '中国', data: [
            { address: '0xe386bb9e01b3528b75f3751ad8a1e418b207ad979fea364087deef5250a73d3f', bcsBytes: Bcs.getInstance().ser(ValueType.TYPE_U64, 0) },
            { address: '0x07b1e78a99dcb13d2f1411cab294c8a54c44f03f7ab97b0a1bdecec99e1a186c', bcsBytes: Bcs.getInstance().ser(ValueType.TYPE_U64, 1234675) },
        ], value_type: ValueType.TYPE_U64 };
    r.add_data(data_order_number);
    r.add_data(data_order_time);
    r.add_data(data_order_ch);
    r.remove('0xe8778267a777a5f4cc1df30c97fa788c5acb7905fab01e1a7429da622efe48a8', 'order number');
    let po1 = {
        key: 'p1',
        description: 'key p1 TYPE_VEC_U8',
        dataType: RepositoryValueType.String,
    };
    let po2 = {
        key: 'p2',
        description: 'key p2 TYPE_U64',
        dataType: RepositoryValueType.PositiveNumber,
        permissionIndex: 10002,
    };
    r.add_policies([po1, po2]);
    r.launch();
};
export const test_repository_policy = async (protocol, param) => {
    let permission_id = param.get('permission::Permission')[0];
    let repo_id = param.get('repository::Repository')[0];
    let po1 = {
        key: 'order number',
        description: 'key p1 TYPE_VEC_U8',
        dataType: RepositoryValueType.String,
    };
    let po2 = {
        key: 'order time',
        description: 'key p2 TYPE_U64',
        dataType: RepositoryValueType.PositiveNumber,
        permissionIndex: 10002,
    };
    let data_order_number = { key: 'order number', data: [
            { address: '0x07b1e78a99dcb13d2f1411cab294c8a54c44f03f7ab97b0a1bdecec99e1a186c', bcsBytes: Bcs.getInstance().ser(ValueType.TYPE_VEC_U8, new TextEncoder().encode('中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中')) }
        ], value_type: ValueType.TYPE_STRING };
    let r = Repository.From(protocol.sessionCurrent(), permission_id, repo_id);
    r.set_description('test policy');
    r.add_policies([po1, po2]); // 'order number' 'order time'
    r.remove_policies(['p2', 'p1']);
    r.set_policy_mode(Repository_Policy_Mode.POLICY_MODE_STRICT); // strict mode
    r.add_reference([permission_id,
        permission_id, repo_id]);
    r.add_data(data_order_number);
};
