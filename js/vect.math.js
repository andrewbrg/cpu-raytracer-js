class VectMath {

    static make(type = 'zero') {
        switch(type) {
            case 'zero':
                return new Vector(0, 0, 0);
            case 'up':
                return new Vector(0, 1, 0);
            case 'down':
                return new Vector(0, -1, 0);
            default:
                return new Vector(0, 0, 0);
        }
    }
    
    static unit(a) {
        return this.scale(a, (1 / this.len(a)));
    } 
    
    static len(a) {
        return Math.sqrt(this.dot(a, a));
    } 
    
    static reflect(a, norm) {
        return this.sub(this.scale(this.scale(norm, this.dot(a, norm)), 2), a);
    }
    
    static dot(a, b) {
        return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
    }
    
    static cross(a, b) {
        return new Vector(
            (a.y * b.z) - (a.z * b.y), 
            (a.z * b.x) - (a.x * b.z),
            (a.x * b.y) - (a.y * b.x)
        );
    }
    
    static scale(a, s) {
        return new Vector(
            a.x * s,
            a.y * s,
            a.z * s
        );
    }
    
    static add(a, b) {
        return new Vector(
           a.x + b.x,
           a.y + b.y,
           a.z + b.z
        );
    }
    
    static sub(a, b) {
        return new Vector(
           a.x - b.x,
           a.y - b.y,
           a.z - b.z
        );
    }
}
