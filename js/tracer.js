class Tracer {
    
    static init(canvasId, width = 500, height = 400, depth = 2) {
        
        this.width  = width;
        this.height = height;
        this.depth  = depth;

        let canvas = document.getElementById(canvasId);
        
        canvas.width  = this.width;
        canvas.height = this.height;
      
        this.canvasCtx     = canvas.getContext('2d'),
        this.canvasData    = this.canvasCtx.getImageData(0, 0, width, height);
        
        this.setScene();
        this.tick();
    }
    
    static setScene() {
        
        let surfaceA = new Surface(
            new Vector(255, 30, 120),
            0.3,
            0.5,
            0.1
        );
        
        let surfaceB = new Surface(
            new Vector(80, 20, 200),
            0.1,
            0.6,
            0.1
        );
        
        let surfaceC = new Surface(
            new Vector(255, 255, 255),
            0.2,
            0.6,
            0.1
        );
        
        this.scene = {
            camera: new Camera(
                60, 
                new Vector(0, 1.8, 10),
                new Vector(0, 3, 0)
            ),
            lights: [
                new Vector(-30, -10, 20)
            ],
            objs: [
                new Sphere(new Vector(0, 3.5, -3), 3, surfaceA),
                new Sphere(new Vector(-4, 2, -1), 0.2, surfaceB),
                new Sphere(new Vector(-4, 3, -1), 0.1, surfaceC)
            ]
        };
    }
    
    static createWorkers() {
        
        
    }

    static generateRays() {

        let eyeVect  = VectMath.unit(VectMath.sub(this.scene.camera.vector, this.scene.camera.point));
        let eyeVectR = VectMath.unit(VectMath.cross(eyeVect, VectMath.make('up')));
        let eyeVectU = VectMath.unit(VectMath.cross(eyeVectR, eyeVect));
        
        this.rays = new Array(this.width);
        for (let i = 0; i < this.rays.length; i++) {
          this.rays[i] = new Array(this.height);
        }

        this.fovRad = Math.PI * (this.scene.camera.fov / 2) / 180;
        this.halfW  = Math.tan(this.fovRad);
        this.halfH  = (this.height / this.width) * this.halfW;
        this.pxW    = (this.halfW * 2) / (this.width - 1);
        this.pxH    = (this.halfH * 2) / (this.height - 1);
        
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                this.rays[x][y] = {
                    x: x,
                    y: y,
                    vector: VectMath.unit(
                        VectMath.add(
                            VectMath.add(
                                eyeVect, 
                                VectMath.scale(eyeVectR, ((x * this.pxW) - this.halfW))
                            ),
                            VectMath.scale(eyeVectU, ((y * this.pxH) - this.halfH))
                        )
                    ),
                    point: this.scene.camera.point
                };
            }
        }
    }
    
    static render() {
        
        let index, color;
        
        if(!this.rays) {
            this.generateRays();
        }
        
        for (let x = 0; x < this.rays.length; x++) {
            for (let y = 0; y < this.rays[0].length; y++) {
                
                color = this.trace(this.rays[x][y], 0);
                index = (x * 4) + (y * 4 * this.width);
                
                this.canvasData.data[index + 0] = color.x;
                this.canvasData.data[index + 1] = color.y;
                this.canvasData.data[index + 2] = color.z;
                this.canvasData.data[index + 3] = 255;
            }
        }
    
        this.canvasCtx.putImageData(this.canvasData, 0, 0);
    }
    
    static trace(ray, depth) {
        
        if (depth > this.depth) {
            return;
        } 
        
        let intSec = this.intersectScene(ray);

        if (intSec.distance === Infinity) {
            return VectMath.make('zero');
        }
        
        let intSecPoint = VectMath.add(
            ray.point, 
            VectMath.scale(ray.vector, intSec.distance)
        );

        let lambertAmt = 0;
        let normVect   = intSec.object.normal(intSecPoint);
        let colorVect  = VectMath.make('zero');
        
        if (intSec.object.surface.lambert) {
            
            for (let i = 0; i < this.scene.lights.length; i++) {
                
                let lightPoint = this.scene.lights[i];
        
                if (!this.isLightVisible(intSecPoint, lightPoint)) {
                    continue;
                }
    
                let contribution = VectMath.dot(
                    VectMath.unit(VectMath.sub(lightPoint, intSecPoint)), 
                    normVect
                );
               
                if (contribution > 0) {
                    lambertAmt += contribution;
                }
            }
        }
  
        if (intSec.object.surface.specular) {
            
            let reflRay = {
                point: intSecPoint,
                vector: VectMath.reflect(ray.vector, normVect)
            };
            
            let reflColor = this.trace(reflRay, ++depth);
            if (reflColor) {
                colorVect = VectMath.add(
                    colorVect, 
                    VectMath.scale(reflColor, intSec.object.surface.specular)
                );
            }
        }
    
        return VectMath.add(
            VectMath.add(
                colorVect,
                VectMath.scale(intSec.object.surface.color, Math.min(1, lambertAmt) * intSec.object.surface.lambert)
            ),
            VectMath.scale(intSec.object.surface.color, intSec.object.surface.ambient)
        );
    }
    
    
    static intersectScene (ray) {

        let intSec = {
            distance: Infinity
        };
        
        for (let i = 0; i < this.scene.objs.length; i++) {
            
            let object   = this.scene.objs[i];
            let distance = object.intersect(ray);
            
            if (distance !== Infinity && distance < intSec.distance) {
                intSec.distance = distance;
                intSec.object   = object;
            }
        }
        
        return intSec;
    }
    
    static isLightVisible(point, light) {
            
        let intSec = this.intersectScene({
            point: point,
            vector: VectMath.unit(VectMath.sub(point, light))
        });
        
        return intSec.distance > -0.005;
    }
    
    static tick(obj1 = 0, obj2 = 0) {

        obj1 += 0.1;
        obj2 += 0.2;
   
        this.lastTick = new Date();
        this.scene.objs[1].point.x = Math.sin(obj1) * 3.5;
        this.scene.objs[1].point.z = -3 + (Math.cos(obj1) * 3.5);
    
        this.scene.objs[2].point.x = Math.sin(obj2) * 4;
        this.scene.objs[2].point.z = -3 + (Math.cos(obj2) * 4);
    
        this.render();
  
        if (this.playing) {
            window.setTimeout(() => {
                this.tick(obj1, obj2);
                let thisTick = new Date();
                this.fps = (1000 / (thisTick - this.lastTick)).toFixed(2);
                this.lastTick = thisTick;
            }, 
            5);
        }
    }
    
    static play() {
        if(!this.playing){
            this.playing = true;
            this.tick(0, 0);
        }
    }
    
    static stop() {
        this.playing = false;
    }
    
    static getDepth() {
        return this.depth;
    }

    static setDepth(depth) {
        this.depth = depth;
    }
    
    static getFov() {
        return this.scene.camera.fov;
    }
    
    static setFov(fov) {
        this.scene.camera.fov = fov;
        this.rays = null;
    }
    
    static getFps() {
        if(!this.playing){
            return 0;
        }
        return this.fps;
    }
}
