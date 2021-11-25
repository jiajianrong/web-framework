import 'reflect-metadata';
import * as Koa from 'koa';
const app = new Koa();

export type Construct<T = any> = new (...args: Array<any>) => T

export const CONTROLLER_METADATA = 'controller';
export const ROUTE_METADATA = 'route';
export const CONTROLLER_LIST = [];

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

export function route(path: string): MethodDecorator {
    return function(targetClazzPrototype: Object,
                    propertyKey: string,
                    descriptor: PropertyDescriptor) {
        // 保存子路由到实例方法元数据
        Reflect.defineMetadata(
            ROUTE_METADATA,
            path,
            targetClazzPrototype,
            propertyKey,
        );
    }
}


@Controller('/test')
export class TestController {
    // @Inject()
    // ctx: Koa.ParameterizedContext;
    @route('/say')
    say() {
        console.log('test.say()');
        return 'test.say()';
    }
    @route('/shout')
    shout() {
        console.log('test.shout()');
        return 'test.shout()';
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
    return;
    CONTROLLER_LIST.forEach(controller => {
        let path = Reflect.getMetadata(CONTROLLER_METADATA, controller);
        console.log('1,------->controller.path: ', path);        
    });
})();


app.use(async function(ctx: Koa.ParameterizedContext, next) {
    const { path } = ctx;
    console.log('ctx.path: ' + path);

    // 使用path过滤controller
    let ctrlArr = CONTROLLER_LIST.filter(controller => {
        let ctrlMeta = Reflect.getMetadata(CONTROLLER_METADATA, controller);
        return path.startsWith(ctrlMeta);
    });

    if (ctrlArr.length<=0) {
        ctx.body = 'no controller matched!';
        return;
    }

    // 找到path命中的controller
    let ctrlClazz = ctrlArr[0];
    let ctrlClazzPrototype = ctrlArr[0].prototype;

    // 使用path过滤route(controller的method)
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
        ctx.body = 'no method matched!';
        return;
    }

    // 找到path命中的controller的route
    let route = routeArr[0];

    // instantiate ctrlClazz&route
    let controller = new ctrlClazz();
    ctx.body = controller[route]();
});

app.listen(9999);