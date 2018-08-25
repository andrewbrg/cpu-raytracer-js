class Sphere {
    
    constructor(point, radius, surface) {
        this.type    = 'sphere';
        this.point   = point;
        this.radius  = radius;
        this.surface = surface;
    }
    
    intersect(ray) {
   
        let eyeToCenterVect = VectMath.sub(this.point, ray.point);
        let vDot            = VectMath.dot(eyeToCenterVect, ray.vector);
        let eoDot           = VectMath.dot(eyeToCenterVect, eyeToCenterVect);
        let discriminant    = (this.radius * this.radius) - eoDot + (vDot * vDot);

        return (discriminant < 0) 
            ? Infinity
            : (vDot - Math.sqrt(discriminant));
    }
    
    normal(pos) {
        return VectMath.unit(VectMath.sub(pos, this.point));
    }
}
