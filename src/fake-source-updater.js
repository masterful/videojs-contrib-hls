/**
 * @file fake-source-updater.js
 */

/**
 * Fake the source updater
 *
 * @class SourceUpdater
 * @param {MediaSource} mediaSource the MediaSource to create the
 * SourceBuffer from
 * @param {String} mimeType the desired MIME type of the underlying
 * SourceBuffer
 */
export default class FakeSourceUpdater {
  constructor(mediaSource) {
    this.timestampOffset_ = 0;
    this.buffered_ = [];
    this.mediaSource = mediaSource;
  }

  /**
   * Aborts the current segment and resets the segment parser.
   *
   * @param {Function} done function to call when done
   * @see http://w3c.github.io/media-source/#widl-SourceBuffer-abort-void
   */
  abort(done) {
    done();
  }

  /**
   * Queue an update to append an ArrayBuffer.
   *
   * @param {ArrayBuffer} bytes
   * @param {Function} done the function to call when done
   * @see http://www.w3.org/TR/media-source/#widl-SourceBuffer-appendBuffer-void-ArrayBuffer-data
   */
  appendBuffer(bytes, done) {
    done();
  }

  /**
   * Indicates what TimeRanges are buffered in the managed SourceBuffer.
   *
   * @see http://www.w3.org/TR/media-source/#widl-SourceBuffer-buffered
   */
  buffered() {
    return videojs.createTimeRanges(this.buffered_);
  }

  /**
   * Queue an update to set the duration.
   *
   * @param {Double} duration what to set the duration to
   * @see http://www.w3.org/TR/media-source/#widl-MediaSource-duration
   */
  duration(duration) {
    this.duration = duration;
  }

  /**
   * Queue an update to remove a time range from the buffer.
   *
   * @param {Number} start where to start the removal
   * @param {Number} end where to end the removal
   * @see http://www.w3.org/TR/media-source/#widl-SourceBuffer-remove-void-double-start-unrestricted-double-end
   */
  remove(start, end) {
  }

  /**
   * wether the underlying sourceBuffer is updating or not
   *
   * @return {Boolean} the updating status of the SourceBuffer
   */
  updating() {
    return false;
  }

  /**
   * Set/get the timestampoffset on the SourceBuffer
   *
   * @return {Number} the timestamp offset
   */
  timestampOffset(offset) {
    if (typeof offset !== 'undefined') {
      this.timestampOffset_ = offset;
    }
    return this.timestampOffset_;
  }

  /**
   * dispose of the source updater and the underlying sourceBuffer
   */
  dispose() {
  }
}
