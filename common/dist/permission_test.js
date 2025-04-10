import { PermissionIndex, Permission } from 'wowok';
import { TEST_ADDR } from './common.js';
const permission_entity_1 = {
    address: TEST_ADDR(),
    permissions: [{ index: PermissionIndex.demand_expand_time }, { index: PermissionIndex.demand_description }],
};
const permission_entity_2 = {
    address: '0x07b1e78a99dcb13d2f1411cab294c8a54c44f03f7ab97b0a1bdecec99e1a186c',
    permissions: [{ index: PermissionIndex.demand }, { index: PermissionIndex.machine },
        { index: PermissionIndex.machine }, { index: PermissionIndex.arbitration_description }],
};
const permission_entity_3 = {
    address: '0xe8778267a777a5f4cc1df30c97fa788c5acb7905fab01e1a7429da622efe48a8',
    permissions: [{ index: PermissionIndex.demand }, { index: PermissionIndex.machine }],
};
export const test_permission_launch = async (protocol, param) => {
    let p = Permission.New(protocol.sessionCurrent(), 'permission test');
    p.add_entity([permission_entity_1, permission_entity_2]);
    p.add_entity([permission_entity_3, permission_entity_2]);
    p.add_admin(['0x07b1e78a99dcb13d2f1411cab294c8a54c44f03f7ab97b0a1bdecec99e1a186c',
        '0x3ce6931306dcfd4eb4be7013caa9077b1a8166b361c9f1e87057eab13bd1b34a']);
    p.remove_entity([permission_entity_3.address]); // remove per3
    p.remove_index(permission_entity_2.address, [permission_entity_2.permissions[0].index, permission_entity_2.permissions[1].index]); // remove per2 indexes 
    p.launch();
};
export const test_permission_set_guard = async (protocol, param) => {
    let p = param.get('permission::Permission')[0];
    let g1 = param.get('guard::Guard')[0];
    let g2 = param.get('guard::Guard')[1];
    if (!p || !g1 || !g2) {
        console.log('test_permission_set_guard error 1');
        return;
    }
    let permission = Permission.From(protocol.sessionCurrent(), p);
    permission.set_guard(permission_entity_1.address, permission_entity_1.permissions[0].index, g1); // set 
    permission.set_guard(permission_entity_1.address, permission_entity_1.permissions[0].index); // unset
    permission.set_guard(permission_entity_1.address, permission_entity_1.permissions[0].index, g1); // set 
    permission.set_guard(permission_entity_1.address, permission_entity_1.permissions[1].index, g2); // set
};
