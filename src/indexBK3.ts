import 'reflect-metadata';
//const http = require('http');
import * as Koa from 'koa';
const app = new Koa();

const CONTROLLER_METADATA = 'controller';
//const ROUTE_METADATA = 'method';

const CONTROLLER_LIST = [];
//const ROUTE_LIST = [];

//@ts-ignore
function say(name: string): MethodDecorator {
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

function Controller(path: string): ClassDecorator {
    return target => {
        // 全局数组保存
        CONTROLLER_LIST.push(target);
        // 保存根路由到类元数据
        Reflect.defineMetadata(CONTROLLER_METADATA, path, target);
    }
}

@Controller('/test')
export class TestController {

    // @Inject()
    // ctx: Koa.ParameterizedContext;

    //@say('/say')
    say(score: number) {
        console.log('test.say() ' + score);
    }
}


@Controller('/another')
export class AnotherController {
    //@Get('/run')
    run() {
        console.log('another.run()');
    }
}


(function main() {

    CONTROLLER_LIST.forEach(clazz=>{
        let ctrlMeta = Reflect.getMetadata(CONTROLLER_METADATA, clazz);
        console.log(ctrlMeta);
    });

})();





app.use(async function(ctx: Koa.ParameterizedContext, next) {
    console.log('ctx.path: ' + ctx.path);

    const { path } = ctx;

    let ctrl = CONTROLLER_LIST.filter(clazz => {
        let ctrlMeta = Reflect.getMetadata(CONTROLLER_METADATA, clazz);
        return ctrlMeta === path;
    });

    console.log('ctrl', ctrl);

    ctx.body = 'hello';
});

app.listen(9999);