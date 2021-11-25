import 'reflect-metadata';
import * as Koa from 'koa';

export type Construct<T = any> = new (...args: Array<any>) => T;
export const CONTROLLER_METADATA = 'controller';
export const ROUTE_METADATA = 'route';
export const INJECT_METADATA = 'inject';
export const INJECT_MAP_ON_PROTO = 'inject_key';
export const CONTROLLER_LIST = [];


export function Controller(path: string): ClassDecorator {
    return function(targetClazz: Function) {
        // 全局数组保存
        CONTROLLER_LIST.push(targetClazz);
        // 保存根路由到类元数据
        Reflect.defineMetadata(
            CONTROLLER_METADATA,
            path,
            targetClazz,
        );
    };
}


export function Route(path: string): MethodDecorator {
    return function(targetClazzPrototype: Object,
                    propertyKey: string,
                    descriptor: PropertyDescriptor) {
        // 保存子路由到实例方法元数据
        // proto上，methodName为key，保存path
        Reflect.defineMetadata(
            ROUTE_METADATA,
            path,
            targetClazzPrototype,
            propertyKey,
        );
    }
}


export function Inject(): PropertyDecorator {
    return function(targetClazzPrototype: Object, propertyKey: string) {
        // 取出当前inject的Obj的Type
        let propertyType = Reflect.getMetadata(
            'design:type',
            targetClazzPrototype,
            propertyKey,
        );

        // proto上，key为INJECT_MAP_ON_PROTO，取出injectedObjMap
        let _map = Reflect.getMetadata(
            INJECT_METADATA,
            targetClazzPrototype,
            INJECT_MAP_ON_PROTO,
        ) || {};

        _map[propertyKey] = propertyType;

        // 重置_map，放回到proto，key不变
        Reflect.defineMetadata(
            INJECT_METADATA,
            _map,
            targetClazzPrototype,
            INJECT_MAP_ON_PROTO,
        );
    }
}


// --------------------------------
// --------------------------------
export default class AService {
    name = 'aService';
    doSth() {
        return this.name + '_doSth';
    }
}
// --------------------------------
// --------------------------------
@Controller('/test')
export class TestController {
    @Inject()
    ctx: Koa.ParameterizedContext;

    @Inject()
    aService: AService;
    
    @Route('/say')
    say() {
        return 'test.say(), path ' + this.ctx.path + ', ' + this.aService.doSth();
    }
    
    @Route('/shout')
    shout() {
        return 'test.shout()';
    }
}
// --------------------------------
// --------------------------------
@Controller('/another')
export class AnotherController {
    @Route('/run')
    run() {
        return 'another.run()';
    }
}
// --------------------------------
// ------------------------


/**
 * match and return controller class
 * @param path 
 * @returns 
 */
function _matchController(path: string) {
    // 找到path命中的controller
    let ctrlArr = CONTROLLER_LIST.filter(controller => {
        let ctrlMeta = Reflect.getMetadata(CONTROLLER_METADATA, controller);
        return path.startsWith(ctrlMeta);
    });
    if (ctrlArr.length<=0) {
        return null;
    }
    return ctrlArr[0];
}


/**
 * match and return route|method as string
 * @param path 
 * @param ctrlClazz 
 * @returns 
 */
function _matchRoute(path, ctrlClazz) {
    let ctrlClazzPrototype = ctrlClazz.prototype;
    // 找到path命中的controller的route
    let routeArr = Object.getOwnPropertyNames(ctrlClazzPrototype)
        .filter(methodName => methodName !== 'constructor')
        .filter(methodName => {
            let routeMeta = Reflect.getMetadata(
                ROUTE_METADATA,
                ctrlClazzPrototype,
                methodName,
            );
            return path.endsWith(routeMeta);
        });

    if (routeArr.length<=0) {
        return null;
    }
    return routeArr[0];
}


/**
 * instantiate ctrlClazz & call method
 * @param ctx 
 * @param clazz 
 * @param method 
 * @returns
 */
function _reflectClazzMethod<T>(
    ctx: Koa.ParameterizedContext,
    clazz: Construct<T>,
    method: string) {

    // 一个util方法，修改Object的value并返回新Object
    const _objectMap = (obj, fn) => Object.fromEntries(
        Object.entries(obj).map(([k, v], i) => [k, fn(v, k, i)])
    );

    // 实例化controller
    let controllerInstance = new clazz();

    // 获取被Inject()修饰的属性
    let _injectPropMap = Reflect.getMetadata(
        INJECT_METADATA,
        clazz.prototype,
        INJECT_MAP_ON_PROTO
    );

    if (_injectPropMap) {
        let props2Inject = _objectMap(_injectPropMap, (v: Construct<T>, k: string) => {
            return k==='ctx' ? ctx : new v();
        });

        props2Inject = _objectMap(props2Inject, (v: T, k: string) => {
            return {value: v, writable: true};
        })

        // 为controller的inject属性赋值
        Object.defineProperties(controllerInstance, props2Inject);
    }

    return controllerInstance[method]();
}



const app = new Koa();
app.use(async function(ctx: Koa.ParameterizedContext, next) {
    const { path } = ctx;

    // 使用path过滤controller
    let ctrlClazz = _matchController(path);

    if (!ctrlClazz) {
        ctx.body = 'no controller matched!';
        return;
    }

    // 使用path过滤route(controller的method)
    let route = _matchRoute(path, ctrlClazz);

    if (!route) {
        ctx.body = 'no route[method] matched!';
        return;
    }

    // 反射执行类方法
    ctx.body = _reflectClazzMethod(ctx, ctrlClazz, route);
});
app.listen(9999);



