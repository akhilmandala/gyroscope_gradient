new Vue({
	el: "#main",
  data: { 
    P: { //parameters  
    	playStack: false,
      showHCost: true,
      showMCost: true,
    	period: 20,
      aM:1, aH:1.5,
      regM:.01, regH:0,
      learnrate: 0.5,
      /* learnrate2: 0.001, */
      smooth: 0.9,
      radius: 150,
      dotRadius: 10,
      showInput: false,
      costWidth: 4,
      colorM: 'hsl(0,50%,50%)',
      colorH: 'yellow'
    },
    I: { //inputs
    	hasStarted: false,
    	isRunning: false,
      posX: 0,
      posY: 0,
      theta: 0,
      radius: 0
    },
  	O: { //outputs
    	time: 0,
      cost: 0,
      elapsed: 0,
      period: 0,
      fps: 0,
      costH: 0,
      gradH: 0,
      gradHStack: 0,
      costM: 0,
      gradM: 0,
      gradMStack: 0,
    },
    S: { //state
    	prevT: 0,
      machine: 0.001,
    },
    H: { //history
    	I: {}, O: {time:[]}, S: {}
    },
    canvas: null,
  },
  filters: {
  	toSeconds(val) { return (val/1000).toFixed(2) },
    toFixed(val) { return Number.isInteger(val) || typeof val == 'boolean' ? val : val.toFixed(2) }
  },
  computed: {
  	csv() {
    	let c = "data:text/csv;charset=utf-8,"
      for (var o in this.H.O) c += 'O.' + o + ','
      for (var i in this.H.I) c += 'I.' + i + ','
      for (var s in this.H.S) c += 'S.' + s + ','
      c += "%0A"
      for (var t = 0; t < this.H.O.time.length; t++) {
        for (var o in this.H.O) c += this.H.O[o][t] + ','
        for (var i in this.H.I) c += this.H.I[i][t] + ','
        for (var s in this.H.S) c += this.H.S[s][t] + ','
        c += "%0A"
      }
      
    	return c
    },
    filename() {
    	return 'data.csv'
    }
  },
  methods: {
  	reset() {
    	this.O.elapsed = 0
      this.O.fps = 1000/this.P.period
      this.O.period = this.P.period
      this.S.prevT = this.getTime()
      this.I.hasStarted = false
      this.I.isRunning = false
      this.I.theta = 0   	
      this.I.radius = 100  	
      for (var i in this.O) this.H.O[i] = []
      for (var i in this.I) this.H.I[i] = []
      for (var i in this.S) this.H.S[i] = []
      this.tick()
    },
    start() {
    	this.I.hasStarted = true      
    	this.I.isRunning = true
      this.tick()
    },
    stop() {
    	this.I.isRunning = false
    },
    getTime() {
    	const d = new Date()
      return d.getTime()
    },
    smooth(val1, val2) {
    	return this.P.smooth*val1 + (1-this.P.smooth)*val2
    },
    log() {
    	for (var i in this.I) this.H.I[i].push(this.I[i])
    	for (var o in this.O) this.H.O[o].push(this.O[o])
    	for (var s in this.S) this.H.S[s].push(this.S[s])
    },
    update() {
    	const aM = this.P.aM
    	const aH = this.P.aH
    	const regM = this.P.regM
    	const regH = this.P.regH
      
      const x = this.S.machine //theta
      const y = this.I.theta //machine
      
      const s = (v) => Math.sin(v)
      const c = (v) => Math.cos(v)
      
      
      this.O.costM = -c(x) + aM*c(x - y)
      this.O.costH = -c(y) + aH*c(y - x)
      
      this.O.gradM = s(x) - aM*s(x - y)
      this.O.gradH = s(y) - aH*s(y - x)
      
      this.O.gradMStack = s(x) - aM*s(x-y) - aM*aH*c(x-y)*s(x-y) / (c(y)-aH*c(x-y)+regM)
      this.O.gradHStack = s(y) - aH*s(y-x) - aM*aH*c(y-x)*s(y-x) / (c(x)-aM*c(y-x)+regH)
      
      const g = this.P.playStack ? this.O.gradMStack : this.O.gradM
    	this.S.machine -= this.P.learnrate*g
      
    },
  	tick() {
    	this.O.time = Date.now() 
    	const startT = this.getTime()
      const deltaT = startT - this.S.prevT
      
      this.update()
      this.draw()

			if (this.I.isRunning) {
      	window.setTimeout(this.tick, 
          this.P.period > 0 ? this.P.period : 10)
      }
      this.O.elapsed += this.P.period
      if(deltaT) this.O.fps = this.smooth(this.O.fps, 1000/deltaT)
      this.O.period = this.smooth(this.O.period, deltaT)
      this.S.prevT = startT
      
      this.log()
    },
    draw() {
    	const width = this.canvas.width;
    	const height = this.canvas.height;
      const R = this.P.radius;

			const theta = this.S.machine;
      let x = Math.sin(theta)*R 
      let y = Math.cos(theta)*R 

			ctx = this.canvas.getContext('2d')
      ctx.resetTransform()        
      ctx.setLineDash([]);
      ctx.lineWidth=1;

      ctx.clearRect(0, 0, width, height)
      ctx.strokeStyle = 'gray'
      ctx.strokeRect(0, 0, width, height)
      ctx.transform(1, 0, 0, 1, width/2, height/2)
      
            
      ctx.strokeStyle = 'white'

      ctx.beginPath();
			ctx.arc(0, 0, R, 0, 2*Math.PI, )
    	ctx.stroke()
      
      
      ctx.beginPath();
			ctx.moveTo(5,0); ctx.lineTo(-5,0);
      ctx.moveTo(0,5); ctx.lineTo(0,-5)
    	ctx.stroke()
          	
            
      
     	ctx.fillStyle = this.P.colorM
    	ctx.beginPath();
    	ctx.arc(x, y, this.P.dotRadius, 0, 2*Math.PI, )
    	ctx.fill()
      
      ctx.fillStyle = this.P.colorH
      ctx.beginPath();
      ctx.arc(R*Math.sin(this.I.theta), 
              R*Math.cos(this.I.theta), 
              this.P.dotRadius, 0, 2*Math.PI, )
      ctx.fill()
      
      const w = this.P.costWidth
      if (this.P.showHCost) {        
      	ctx.setLineDash([9, 1]);

        ctx.strokeStyle = this.P.colorH;
      	ctx.beginPath();
        ctx.lineWidth=w;
        ctx.moveTo(-width/2+w/2+1, height/2);
        ctx.lineTo(-width/2+w/2+1, height/2-(this.O.costH+2)*100)
        ctx.stroke()
      }
      if (this.P.showMCost) {
        ctx.setLineDash([9, 1]);
        ctx.lineWidth=w;
        ctx.strokeStyle = this.P.colorM;
      	ctx.beginPath();
        ctx.moveTo(width/2-w/2-1, height/2);
        ctx.lineTo(width/2-w/2-1, height/2-(this.O.costM+2)*100)
        ctx.stroke()
      }
      if (this.P.showInput) {
        ctx.setLineDash([5, 3]);
        ctx.strokeStyle = 'gray'
        ctx.beginPath();
        ctx.arc(0, 0, this.I.radius, 0, 2*Math.PI, )
        ctx.stroke()
        
        ctx.beginPath();
        ctx.moveTo(0,0); 
        ctx.lineTo(Math.sin(this.I.theta)*this.I.radius, 
          Math.cos(this.I.theta)*this.I.radius)
        ctx.stroke()
      }
    }
  },
  mounted() {
    this.canvas = this.$refs.myCanvas
    this.canvas.addEventListener('mousemove', (e) => {
    	const rect = this.canvas.getBoundingClientRect();
    	const width = this.canvas.width;
    	const height = this.canvas.height;
    	this.I.posX = e.clientX - rect.left
      this.I.posY = e.clientY - rect.top
      this.I.theta = Math.atan2(this.I.posX - width/2,
                                this.I.posY - height/2) 
      this.I.radius = Math.sqrt(
      	Math.pow(this.I.posX - width/2,2)+
        Math.pow(this.I.posY - height/2,2))

    })
    this.canvas.addEventListener('mousedown', (e) => {
    	if(!this.I.hasStarted && !this.I.isRunning) {
      	this.start()
      }    	
      else if(this.I.hasStarted && this.I.isRunning) {
      	this.stop()
      }

    })
    this.reset()
  }
})