import { Entity, Resource, TagName } from 'wowok';
import { ERROR, Errors } from 'wowok';
export const create_my_resource = (protocol) => {
    let wowok_entity = Entity.From(protocol.sessionCurrent());
    wowok_entity.create_resource();
};
export const manage_my_resource = (protocol, param) => {
    let res_id = param.get('resource::Resource')[0];
    if (!res_id)
        ERROR(Errors.InvalidParam, 'manage_my_resource');
    let resource = Resource.From(protocol.sessionCurrent(), res_id);
    // add some to my resource
    resource.add('0xb31312cabe21e089dcd640fab507e133029528fcbbedfb34b91f849a4dd1383c', ['abc', 'my fovor'], '小明');
};
export const like = (protocol, param) => {
    let res_id = param.get('resource::Resource')[0];
    if (!res_id)
        ERROR(Errors.InvalidParam, 'like');
    let resource = Resource.From(protocol.sessionCurrent(), res_id);
    let wowok_entity = Entity.From(protocol.sessionCurrent());
    wowok_entity.mark(resource, res_id, TagName.Like); // like
    wowok_entity.mark(resource, res_id, TagName.Like); // unlike
    wowok_entity.mark(resource, '0xb31312cabe21e089dcd640fab507e133029528fcbbedfb34b91f849a4dd1383c', TagName.Like); // like
    wowok_entity.mark(resource, '0x0b228d3994b147b82f970c399d3c96001442d5cc88bf073617b0957f6d421f09', TagName.Like);
    wowok_entity.mark(resource, res_id, TagName.Dislike); // dislike
};
export const avatar = (protocol, param) => {
    let wowok_entity = Entity.From(protocol.sessionCurrent());
    /*    let personal:Entity_Info = {name:'Jack Chou', description:'hahah', avatar:'https://wowok.ai/0x123.png', twitter:'@Wowok_Ai',
            discord:'https://discord.gg/JbYneRzB8a', homepage:'https://github.com/wowok-ai/sdk/wiki'}*/
    let personal = { name: 'hi' };
    wowok_entity.update(personal);
};
export const transfer_resource = (protocol, param) => {
    let res_id = '';
    if (typeof (param) === 'string') {
        res_id = param;
    }
    else {
        res_id = param.get('resource::Resource')[0];
    }
    if (!res_id)
        ERROR(Errors.InvalidParam, 'transfer_resource');
    let resource = Resource.From(protocol.sessionCurrent(), res_id);
    let wowok_entity = Entity.From(protocol.sessionCurrent());
    // transfer_resource param2 must has resource yet
    wowok_entity.transfer_resource(resource, '0x227b5c82e1e0bae176720fa8803e8c87cb3f8defa6d51150b2388a3270ff1f49');
};
export const destroy_resource = (protocol, param) => {
    let res_id = '';
    if (typeof (param) === 'string') {
        res_id = param;
    }
    else {
        res_id = param.get('resource::Resource')[0];
    }
    if (!res_id)
        ERROR(Errors.InvalidParam, 'destroy_resource');
    let resource = Resource.From(protocol.sessionCurrent(), res_id);
    let wowok_entity = Entity.From(protocol.sessionCurrent());
    wowok_entity.destroy_resource(resource);
};
