class VectMath {

    static make(type = 'zero') {
        switch(type) {
            case 'zero':
                return {x: 0, y: 0, z: 0};
            case 'up':
                return {x: 0, y: 1, z: 0};
            case 'down':
                return {x: 0, y: -1, z: 0};
            case 'left':
                return {x: -1, y: 0, z: 0};
            case 'right':
                return {x: 1, y: 0, z: 0};
            case 'in':
                return {x: 0, y: 0, z: 1};
            case 'out':
                return {x: 0, y: 0, z: -1};
            case 'white':
                return {x: 255, y: 255, z: 255};
            default:
                return {x: 0, y: 0, z: 0};
        }
    }
    
    static unit(a) {
        return this.scale(a, (1 / this.len(a)));
    } 
    
    static len(a) {
        return Math.sqrt(this.dot(a, a));
    } 
    
    static dot(a, b) {
        return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
    }
    
    static cross(a, b) {
        return {
            x: (a.y * b.z) - (a.z * b.y),
            y: (a.z * b.x) - (a.x * b.z),
            z: (a.x * b.y) - (a.y * b.x)
        };
    }
    
    static scale(a, s) {
        return {
            x: a.x * s,
            y: a.y * s,
            z: a.z * s
        };
    }
    
    static add(a, b) {
        return {
            x: a.x + b.x,
            y: a.y + b.y,
            z: a.z + b.z
        };
    }
    
    static sub(a, b) {
        return {
            x: a.x - b.x,
            y: a.y - b.y,
            z: a.z - b.z
        };
    }
    
    static reflect(a, norm) {
        return this.sub(this.scale(this.scale(norm, this.dot(a, norm)), 2), a);
    }
}
