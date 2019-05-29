export default {
  name: 'ElMarker',

  props: {
    mark: {
      type: [String, Object]
    }
  },
  render() {
    // [L] 判断传入的值是string or obj， 如果是string, 则作为label展示，否则取obj.label
    let label = typeof this.mark === 'string' ? this.mark : this.mark.label;

    return (
      <div class="el-slider__marks-text" style={ this.mark.style || {} }>
        { label }
      </div>
    );
  }
};
