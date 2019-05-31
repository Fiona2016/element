<template>
  <div
    class="el-slider"
    :class="{ 'is-vertical': vertical, 'el-slider--with-input': showInput }"
    role="slider"
    :aria-valuemin="min"
    :aria-valuemax="max"
    :aria-orientation="vertical ? 'vertical': 'horizontal'"
    :aria-disabled="sliderDisabled"
  >
  <!--  is-vertical 是否是垂直方向展示 -->
  <!--  是否显示Input也会影响样式布局。 Aria 学习见learn.note.md -->
    <el-input-number
      v-model="firstValue"
      v-if="showInput && !range"
      class="el-slider__input"
      ref="input"
      @change="$nextTick(emitChange)"
      :step="step"
      :disabled="sliderDisabled"
      :controls="showInputControls"
      :min="min"
      :max="max"
      :debounce="debounce"
      :size="inputSize">
    </el-input-number>
    <div
      class="el-slider__runway"
      :class="{ 'show-input': showInput, 'disabled': sliderDisabled }"
      :style="runwayStyle"
      @click="onSliderClick"
      ref="slider">
      <div
        class="el-slider__bar"
        :style="barStyle">
      </div>
      <slider-button
        :vertical="vertical"
        v-model="firstValue"
        :tooltip-class="tooltipClass"
        ref="button1">
      </slider-button>
      <slider-button
        :vertical="vertical"
        v-model="secondValue"
        :tooltip-class="tooltipClass"
        ref="button2"
        v-if="range">
      </slider-button>
      <div
        class="el-slider__stop"
        v-for="(item, key) in stops"
        :key="key"
        :style="getStopStyle(item)"
        v-if="showStops">
      </div>
      <template v-if="markList.length > 0">
        <div>
          <div
            v-for="(item, key) in markList"
            :style="getStopStyle(item.position)"
            class="el-slider__stop el-slider__marks-stop"
            :key="key">
          </div>
        </div>
        <div class="el-slider__marks">
          <slider-marker
            :mark="item.mark" v-for="(item, key) in markList"
            :key="key"
            :style="getStopStyle(item.position)">
          </slider-marker>
        </div>
      </template>
    </div>
  </div>
</template>

<script type="text/babel">
  import ElInputNumber from 'element-ui/packages/input-number';
  import SliderButton from './button.vue';
  import SliderMarker from './marker';
  import Emitter from 'element-ui/src/mixins/emitter';

  export default {
    name: 'ElSlider',

    mixins: [Emitter],

    inject: {
      elForm: {
        default: ''
      }
    },

    props: {
      // 最小值
      min: {
        type: Number,
        default: 0
      },
      // 最大值
      max: {
        type: Number,
        default: 100
      },
      // 步长，默认1
      step: {
        type: Number,
        default: 1
      },
      // 绑定的值，默认是number, range => Array
      value: {
        type: [Number, Array],
        default: 0
      },
      // 是否显示input number
      showInput: {
        type: Boolean,
        default: false
      },
      // input number的控制按钮
      showInputControls: {
        type: Boolean,
        default: true
      },
      // for input number
      inputSize: {
        type: String,
        default: 'small'
      },
      // 显示间隔点
      showStops: {
        type: Boolean,
        default: false
      },
      showTooltip: {
        type: Boolean,
        default: true
      },
      formatTooltip: Function,
      disabled: {
        type: Boolean,
        default: false
      },
      range: {
        type: Boolean,
        default: false
      },
      vertical: {
        type: Boolean,
        default: false
      },
      // 垂直方向的slider需要height
      height: {
        type: String
      },
      // Input number 使用
      debounce: {
        type: Number,
        default: 300
      },
      label: {
        type: String
      },
      tooltipClass: String,
      marks: Object
    },

    components: {
      ElInputNumber,
      SliderButton,
      SliderMarker
    },

    data() {
      return {
        firstValue: null, // if range
        secondValue: null, // if range
        oldValue: null, // prev value
        dragging: false, // 是否在拖拽
        sliderSize: 1 // slider的client W or client H depend on orientation
      };
    },

    watch: {
      value(val, oldVal) {
        if (this.dragging ||
          Array.isArray(val) &&
          Array.isArray(oldVal) &&
          val.every((item, index) => item === oldVal[index])) {
          return;
        }
        this.setValues();
      },

      dragging(val) {
        if (!val) { // 停止drag时设置value
          this.setValues();
        }
      },

      firstValue(val) {
        if (this.range) {
          this.$emit('input', [this.minValue, this.maxValue]);
        } else {
          this.$emit('input', val);
        }
      },

      secondValue() {
        if (this.range) {
          this.$emit('input', [this.minValue, this.maxValue]);
        }
      },

      min() {
        this.setValues();
      },

      max() {
        this.setValues();
      }
    },

    methods: {
      valueChanged() {
          // oldValue在这里，防止重复触发，用于和每次新生成的值进行比较，看是否需要emit事件
        if (this.range) {
          return ![this.minValue, this.maxValue]
            .every((item, index) => item === this.oldValue[index]);
        } else {
          return this.value !== this.oldValue;
        }
      },
      setValues() {
        if (this.min > this.max) {
          console.error('[Element Error][Slider]min should not be greater than max.');
          return;
        }
        const val = this.value;
        if (this.range && Array.isArray(val)) {
          if (val[1] < this.min) {
            this.$emit('input', [this.min, this.min]);
          } else if (val[0] > this.max) {
            this.$emit('input', [this.max, this.max]);
          } else if (val[0] < this.min) {
            this.$emit('input', [this.min, val[1]]);
          } else if (val[1] > this.max) {
            this.$emit('input', [val[0], this.max]);
          } else {
            this.firstValue = val[0];
            this.secondValue = val[1];
            if (this.valueChanged()) {
              this.dispatch('ElFormItem', 'el.form.change', [this.minValue, this.maxValue]); // [?]为什么返回的是min和max
              this.oldValue = val.slice(); // [L] 通过slice来生成新的数组
            }
          }
        } else if (!this.range && typeof val === 'number' && !isNaN(val)) {
          if (val < this.min) {
            this.$emit('input', this.min);
          } else if (val > this.max) {
            this.$emit('input', this.max);
          } else {
            this.firstValue = val;
            if (this.valueChanged()) {
              this.dispatch('ElFormItem', 'el.form.change', val);
              this.oldValue = val;
            }
          }
        }
      },

      setPosition(percent) {
        // [key] 根据百分比确定button位置。
        const targetValue = this.min + percent * (this.max - this.min) / 100;
        if (!this.range) {
          this.$refs.button1.setPosition(percent);
          return;
        }
        let button;
        if (Math.abs(this.minValue - targetValue) < Math.abs(this.maxValue - targetValue)) {
            // [?] 因为first value 和second value，刚开始是first更小，但如果一直往右拖拽超过secondValue，此时firstValue会变得更大？
          button = this.firstValue < this.secondValue ? 'button1' : 'button2';
        } else {
          button = this.firstValue > this.secondValue ? 'button1' : 'button2';
        }
        this.$refs[button].setPosition(percent);
      },

      onSliderClick(event) {
        if (this.sliderDisabled || this.dragging) return;
        this.resetSize();
        if (this.vertical) {
          const sliderOffsetBottom = this.$refs.slider.getBoundingClientRect().bottom;
          this.setPosition((sliderOffsetBottom - event.clientY) / this.sliderSize * 100);
        } else {
            // [key] slider改变时计算value，需要从map里面找映射关系
          const sliderOffsetLeft = this.$refs.slider.getBoundingClientRect().left;
          this.setPosition((event.clientX - sliderOffsetLeft) / this.sliderSize * 100);
        }
        this.emitChange();
      },

      resetSize() {
        if (this.$refs.slider) {
          // 记录sliderSize是为了记录slider的总宽度【水平slider】 or 高度【垂直slider】
          this.sliderSize = this.$refs.slider[`client${ this.vertical ? 'Height' : 'Width' }`];
        }
      },

      emitChange() {
        // TODO 为什么这里需要nextTick去做？
        this.$nextTick(() => {
          this.$emit('change', this.range ? [this.minValue, this.maxValue] : this.value);
        });
      },

      getStopStyle(position) {
          // [key] 这里是根据百分比设置的，也需要改掉
        return this.vertical ? { 'bottom': position + '%' } : { 'left': position + '%' };
      }
    },

    computed: {
      stops() {
        if (!this.showStops || this.min > this.max) return [];
        if (this.step === 0) {
          process.env.NODE_ENV !== 'production' &&
          console.warn('[Element Warn][Slider]step should not be 0.');
          return [];
        }
        const stopCount = (this.max - this.min) / this.step;
        const stepWidth = 100 * this.step / (this.max - this.min);
        const result = [];
        for (let i = 1; i < stopCount; i++) {
          result.push(i * stepWidth);
        }
        if (this.range) {
          return result.filter(step => {
            return step < 100 * (this.minValue - this.min) / (this.max - this.min) ||
              step > 100 * (this.maxValue - this.min) / (this.max - this.min);
          });
        } else {
          return result.filter(step => step > 100 * (this.firstValue - this.min) / (this.max - this.min));
        }
      },

      markList() {
        if (!this.marks) {
          return [];
        }

        const marksKeys = Object.keys(this.marks);
        return marksKeys.map(parseFloat)
          .sort((a, b) => a - b) // marks的key排序
          .filter(point => point <= this.max && point >= this.min) // 去掉无用数据
          .map(point => ({
            point,
            position: (point - this.min) * 100 / (this.max - this.min), // 这里用index排序
            mark: this.marks[point] // ? 这是干嘛的？
          }));
      },

      minValue() {
        return Math.min(this.firstValue, this.secondValue);
      },

      maxValue() {
        return Math.max(this.firstValue, this.secondValue);
      },

      barSize() {
        return this.range
          ? `${ 100 * (this.maxValue - this.minValue) / (this.max - this.min) }%`
          : `${ 100 * (this.firstValue - this.min) / (this.max - this.min) }%`; // bar占了多宽
      },

      barStart() {
        return this.range
          ? `${ 100 * (this.minValue - this.min) / (this.max - this.min) }%`
          : '0%';
      },

      precision() {
          // [L] 从min, max和step中获取最大精度作为默认精度
        let precisions = [this.min, this.max, this.step].map(item => {
          let decimal = ('' + item).split('.')[1];
          return decimal ? decimal.length : 0;
        });
        // [L] Precisions是数组，apply第一个参数this,第二个参数argsArray
        // bind 第一个参数this, 之后是各个参数
        return Math.max.apply(null, precisions);
      },

      runwayStyle() {
        return this.vertical ? { height: this.height } : {};
      },

      barStyle() {
        return this.vertical
          ? {
            height: this.barSize,
            bottom: this.barStart
          } : {
            width: this.barSize,
            left: this.barStart
          };
      },

      sliderDisabled() {
        return this.disabled || (this.elForm || {}).disabled;
      }
    },

    mounted() {
      let valuetext;
      if (this.range) { // range prop, 用于指明是否选择某个范围
        if (Array.isArray(this.value)) { // 如果是选择范围，value需要传array
        // range的值，赋值给firstValue & seconed Value, 确保在min和max之间
          this.firstValue = Math.max(this.min, this.value[0]);
          this.secondValue = Math.min(this.max, this.value[1]);
        } else {
          this.firstValue = this.min;
          this.secondValue = this.max;
        }
        this.oldValue = [this.firstValue, this.secondValue]; // ? oldValue干嘛用呢？ 为了和下次改变的数值进行对比？
        valuetext = `${this.firstValue}-${this.secondValue}`; // aria-valuetext使用
      } else {
        if (typeof this.value !== 'number' || isNaN(this.value)) {
          // 异常情况赋默认值，firstValue = min
          this.firstValue = this.min;
        } else {
          // if (value > max) { value = max }
          // if (value < min) { value = min }
          // =>
          // value = min(max(min, value), max)
          // value 的可能值： value < min / min <= value <= max / value > max
          // 首先确保value在min右侧 max(this.value, this.min) 再确保在max左侧 min(max, last)
          this.firstValue = Math.min(this.max, Math.max(this.min, this.value)); // 确保在范围里面 [H]
        }
        this.oldValue = this.firstValue;
        valuetext = this.firstValue;
      }
      this.$el.setAttribute('aria-valuetext', valuetext);

      // label screen reader
      this.$el.setAttribute('aria-label', this.label ? this.label : `slider between ${this.min} and ${this.max}`);

      this.resetSize();
      window.addEventListener('resize', this.resetSize);
    },

    beforeDestroy() {
      window.removeEventListener('resize', this.resetSize);
    }
  };
</script>
