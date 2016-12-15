/**
 * @file track-source-updater.js
 */

/**
 * A source updater for tracks (since we don't use source buffers for those)
 *
 * @class TrackSourceUpdater
 * @param {track} the text track object that we'll be updating
 */
export default class TrackSourceUpdater {
  constructor(track) {
    this.timestampOffset_ = 0;
    this.buffered_ = [];
    this.track_ = track;
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
    this.track_.parseCues_(bytes);
    done();
  }

  /**
   * Indicates what TimeRanges are buffered in the managed SourceBuffer.
   *
   * @see http://www.w3.org/TR/media-source/#widl-SourceBuffer-buffered
   */
  buffered() {
    return videojs.createTimeRanges(this.track_.cues_.map((cue) => {
      return [cue.startTime, cue.endTime];
    }));
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
