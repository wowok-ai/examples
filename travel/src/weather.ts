
/**
 * Weather data can come from a named service provider or a predictor
 */

import { call_permission, call_repository, CallPermission_Data, CallRepository_Data, WOWOK } from 'wowok_agent'
import { sleep, TESTOR, TEST_ADDR, result } from './common';

export const weather = async () : Promise<string> => {
    const permission_id = await permission(); await sleep(2000)
    if (!permission_id)  WOWOK.ERROR(WOWOK.Errors.Fail, 'permission object failed.')
    
    const repository_id = await repository(permission_id!); await sleep(2000)
    if (!repository_id) WOWOK.ERROR(WOWOK.Errors.Fail, 'arbitration object failed.')
    
    await update_weather(repository_id!, permission_id!);
    return repository_id!
}

const WEATHER_DATA_PERMISSION = 10000;
export const ABSOLUTE_ZERO_DEGREE = 273;

export enum Weather {
    Condition = 'Condition',
    Minimum_temperature = 'Minimum temperature',
    Maximum_temperature = 'Maximum temperature',
    Ice_scooting_suitable = 'Ice-scooting suitable',
}

export enum Weather_Condition {
    rain = 'rain',
    sunny = 'sunny',
    cloudy = 'cloudy',
}

const repository = async (permission_id:string) : Promise<string | undefined> => {
    const policy : WOWOK.Repository_Policy[] = [
        { key:Weather.Condition, description:'sunny,cloudy,rainy,...', dataType:WOWOK.RepositoryValueType.String, permissionIndex:WEATHER_DATA_PERMISSION}, 
        { key:Weather.Minimum_temperature, description:'sunny,cloudy,rainy,...', dataType:WOWOK.RepositoryValueType.PositiveNumber, permissionIndex:WEATHER_DATA_PERMISSION}, 
        { key:Weather.Maximum_temperature, description:`based on absolute 0 degrees(${ABSOLUTE_ZERO_DEGREE} °C)`, dataType:WOWOK.RepositoryValueType.PositiveNumber, permissionIndex:WEATHER_DATA_PERMISSION}, 
        { key:Weather.Ice_scooting_suitable, description:'Is the weather suitable for ice scooting?', dataType:WOWOK.RepositoryValueType.Bool, permissionIndex:WEATHER_DATA_PERMISSION}, 
    ];

    const data : CallRepository_Data = { object:{permission:permission_id},
        description:`The weather conditions of Langjökull, Iceland; Temperature is based on absolute 0 degrees(${ABSOLUTE_ZERO_DEGREE} °C)`,
        mode:WOWOK.Repository_Policy_Mode.POLICY_MODE_STRICT,
        policy:{op:'add', data:policy},
    }
    return await result('Repository', await call_repository({data:data})) as string;
}

const update_weather = async (repository_id: string, permission_id:string) => {
    const Condition:WOWOK.Repository_Policy_Data = {key:Weather.Condition, data:[], value_type:WOWOK.ValueType.TYPE_STRING};
    const Minimum_temperature:WOWOK.Repository_Policy_Data = {key:Weather.Minimum_temperature, data:[], value_type:WOWOK.ValueType.TYPE_U64};
    const Maximum_temperature:WOWOK.Repository_Policy_Data = {key:Weather.Maximum_temperature, data:[], value_type:WOWOK.ValueType.TYPE_U64};
    const Ice_scooting_suitable:WOWOK.Repository_Policy_Data = {key:Weather.Ice_scooting_suitable, data:[], value_type:WOWOK.ValueType.TYPE_BOOL};
    
    // Provide daily data for the next 7 days
    const time = WOWOK.getUTCDayStartByDivision(); 
    for (let i = 0; i < 7; i++) {
        const addr = WOWOK.uint2address(time + 24*60*60*1000*i); 
        Condition.data.push({address:addr, bcsBytes:WOWOK.Bcs.getInstance().ser(WOWOK.ValueType.TYPE_STRING, Weather_Condition.sunny)})
        Minimum_temperature.data.push({address:addr, bcsBytes:WOWOK.Bcs.getInstance().ser(WOWOK.ValueType.TYPE_U64, -10 + ABSOLUTE_ZERO_DEGREE)})
        Maximum_temperature.data.push({address:addr, bcsBytes:WOWOK.Bcs.getInstance().ser(WOWOK.ValueType.TYPE_U64, -3 + ABSOLUTE_ZERO_DEGREE)})
        Ice_scooting_suitable.data.push({address:addr, bcsBytes:WOWOK.Bcs.getInstance().ser(WOWOK.ValueType.TYPE_BOOL, true)})
    }

    await result('Repository', await call_repository({data:{object:repository_id, data:{op:'add', data:Condition}}}));
    await result('Repository', await call_repository({data:{object:repository_id, data:{op:'add', data:Minimum_temperature}}}));
    await result('Repository', await call_repository({data:{object:repository_id, data:{op:'add', data:Maximum_temperature}}}));
    await result('Repository', await call_repository({data:{object:repository_id, data:{op:'add', data:Ice_scooting_suitable}}}));
}

const permission = async () : Promise<string | undefined> => {
    const data : CallPermission_Data = { description: 'An entity that provides weather data',  object:{name:'insurance permission'},
        biz_permission:{op:'add', data:[{index:WEATHER_DATA_PERMISSION, name:'Update weather data'}]},    
        admin:{op:'add', entities:[{name_or_address:TEST_ADDR()}, {name_or_address:TESTOR[6].address}]}
    }
    return await result('Permission', (await call_permission({data:data})))  as string;
}

