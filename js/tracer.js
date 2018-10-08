class Tracer {
    
    static init(canvasId, width = 800, height = 400, depth = 1, maxWorkers = 10) {
        
        this.width  = width;
        this.height = height;
        this.depth  = depth;
        this.maxWorkers = 10;

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
            new Vector(145, 30, 120),
            1,
            0.4,
            0.05
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
                new Vector(0, 0, 20),
                new Vector(0, 0, 0)
            ),
            lights: [
                new Vector(-20, -10, 20)
            ],
            objs: [
                new Sphere(new Vector(0, 0, 0), 3, surfaceA),
                new Sphere(new Vector(-2, 0, 4), 0.45, surfaceB),
                new Sphere(new Vector(-3, 0, 2), 0.2, surfaceC)
            ]
        };
    }

    static generateRays() {

        let eyeVect  = VectMath.unit(VectMath.sub(this.scene.camera.vector, this.scene.camera.point));
        let eyeVectR = VectMath.unit(VectMath.cross(eyeVect, VectMath.make('up')));
        let eyeVectU = VectMath.unit(VectMath.cross(eyeVectR, eyeVect));

        this.fovRad = Math.PI * (this.scene.camera.fov / 2) / 180;
        this.halfW  = Math.tan(this.fovRad);
        this.halfH  = (this.height / this.width) * this.halfW;
        this.pxW    = (this.halfW * 2) / (this.width - 1);
        this.pxH    = (this.halfH * 2) / (this.height - 1);
        
        this.rays = [];
    
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                this.rays.push({
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
                });
            }
        }
    }
    
    static render() {
        
        let index, color;
        
        if(!this.rays) {
            this.generateRays();
        }

        this.rays.forEach((ray) => {
            
            color = this.trace(ray);
            index = (ray.x * 4) + (ray.y * 4 * this.width);
            
            this.canvasData.data[index + 0] = color.x;
            this.canvasData.data[index + 1] = color.y;
            this.canvasData.data[index + 2] = color.z;
            this.canvasData.data[index + 3] = 255;
        });
    
        this.canvasCtx.putImageData(this.canvasData, 0, 0);
    }
    
    static trace(ray, depth = 0) {
        
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
    
    static tick(speeds = [], cDirs = []) {

        if(speeds.length === 0) {
            for(let i = 0; i < this.scene.objs.length; i++) {
                speeds[i] = Math.random() / 3;
            }
        }
        
  
        this.lastTick = new Date();
        
        let i = 0;
        this.scene.objs.forEach(obj => {
            ['x', 'y'].forEach(c => {
                cDirs[i] = cDirs[i] !== undefined ? cDirs[i] : [];
                if(obj.surface.color[c] <= 0){
                    obj.surface.color[c] = 0;
                    cDirs[i][c] = 'u';
                }
                else if(obj.surface.color[c] >= 255){
                    obj.surface.color[c] = 255;
                    cDirs[i][c] = 'd';
                }
                obj.surface.color[c] += cDirs.length > 0 && cDirs[i][c] === 'u' ? 5 : -5;
            });
            
            i++;
        });
        
        for(let i = 1; i < this.scene.objs.length; i++) {
            let x = this.scene.objs[i].point.x;
            let y = this.scene.objs[i].point.y;
            let z = this.scene.objs[i].point.z;
            this.scene.objs[i].point.x = x * Math.cos(speeds[i]) - z * Math.sin(speeds[i]);
            this.scene.objs[i].point.z = z * Math.cos(speeds[i]) + x * Math.sin(speeds[i]);
            this.scene.objs[i].point.y = y * Math.cos(speeds[i]) - z * Math.sin(speeds[i]);
        }
        
        this.render();
  
        if (this.playing) {
            window.setTimeout(() => {
                this.tick(speeds, cDirs);
                let thisTick = new Date();
                this.fps = (1000 / (thisTick - this.lastTick)).toFixed(2);
                this.lastTick = thisTick;
            }, 
            20);
        }
    }
    
    static play() {
        if(!this.playing){
            this.playing = true;
            this.tick();
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
