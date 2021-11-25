import 'reflect-metadata';
//const http = require('http');
import * as Koa from 'koa';
const app = new Koa();

export const CONTROLLER_METADATA = 'controller';
export const ROUTE_METADATA = 'route';

export const CONTROLLER_LIST = [];
export const ROUTE_LIST = [];

//@ts-ignore
function ddddddd(name: string): MethodDecorator {
	return (target: Object, key: string, descriptor: PropertyDescriptor) => {
        let originMethed = descriptor.value;
        let paramtypes = Reflect.getMetadata('design:paramtypes', target, key);

        console.log(paramtypes[0].name, typeof paramtypes[0]);

        // return (...args) => {
        //     console.log('new')
        // }

        descriptor.value = function (firstParam) {
            console.log(1, name);
            console.log(firstParam);
            let supposedType = paramtypes[0].name.toLowerCase();
            if (typeof firstParam !== supposedType) {
                console.log('!!!notmatch:', typeof firstParam, supposedType);
                firstParam = Number(firstParam);
                console.log('!!!match:', typeof firstParam, supposedType);
            }
            const res = originMethed.apply(this, [firstParam]);
            console.log(3, name);
            return res;
        }

        return descriptor;
	}
}

export function Controller(path: string): ClassDecorator {
    return function(targetClazz: Object) {
        // 全局数组保存
        CONTROLLER_LIST.push({path, targetClazz});
        // 保存根路由到类元数据
        Reflect.getMetadata(CONTROLLER_LIST, targetClazz);
 //       Reflect.defineMetadata(CONTROLLER_METADATA, path, targetClazz);
    };
}

export function route(path: string): MethodDecorator {
    return function(targetClazz: Object, propertyKey: string, descriptor: PropertyDescriptor) {
        ROUTE_LIST.push({path, targetClazz, methodName: propertyKey, method: descriptor.value});
        console.log('route.method', descriptor.value);

        Reflect.defineMetadata(ROUTE_METADATA, {path, methodName: propertyKey}, descriptor.value);
    }
}


@Controller('/test')
export class TestController {

    // @Inject()
    // ctx: Koa.ParameterizedContext;

    @route('/say')
    say(score: number) {
        console.log('test.say() ' + score);
    }
}


@Controller('/another')
export class AnotherController {
    @route('/run')
    run() {
        console.log('another.run()');
    }
}


(function main() {

    CONTROLLER_LIST.forEach(controller => {
        //@ts-ignore
        let ctrlMeta = Reflect.getMetadata(CONTROLLER_METADATA, controller.targetClazz);
        console.log('controller.path: ', ctrlMeta, controller.path);
    });

})();





app.use(async function(ctx: Koa.ParameterizedContext, next) {
    console.log('ctx.path: ' + ctx.path);

    const { path } = ctx;

    let ctrl = CONTROLLER_LIST.filter(controller => {
        let ctrlMeta = controller.path;// Reflect.getMetadata(CONTROLLER_METADATA, controller.path);
        return ctrlMeta === path;
    });

    console.log('ctrl', ctrl);

    let clazz = ctrl[0].targetClazz;

    console.log(clazz);

    console.log('ROUTE_LIST[0].methodName', ROUTE_LIST[0].methodName);
    let methodName = ROUTE_LIST[0].methodName;
    let route = Reflect.getMetadata(ROUTE_METADATA, clazz.prototype[methodName]);
    console.log('route', route);

    ctx.body = 'hello';
});

app.listen(9999);