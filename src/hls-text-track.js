/**
 * @file hls-text-track.js
 */
import {TextTrack, xhr} from 'video.js';
import window from 'global/window';
import PlaylistLoader from './playlist-loader';
import {TextDecoder} from 'text-encoding';

/**
 * HlsTextTrack extends video.js text tracks but adds HLS
 * specific data storage such as playlist loaders, mediaGroups
 * and default/autoselect
 *
 * @param {Object} options options to create HlsTextTrack with
 * @class HlsTextTrack
 * @extends TextTrack
 */
export default class HlsTextTrack extends TextTrack {
  constructor(options) {
    super({
      kind: options.default ? 'main' : 'alternative',
      enabled: options.default || false,
      language: options.language,
      label: options.label,
      tech: options.tech,
    });

    this.uri = options.resolvedUri;
    this.hls = options.hls;
    this.autoselect = options.autoselect || false;
    this.default = options.default || false;
    this.withCredentials = options.withCredentials || false;
    this.mediaGroups_ = [];
    this.addLoader(options.mediaGroup, options.resolvedUri);
    this.decoder_ = new TextDecoder('utf-8');
  }

  /**
   * get a PlaylistLoader from this track given a mediaGroup name
   *
   * @param {String} mediaGroup the mediaGroup to get the loader for
   * @return {PlaylistLoader|Null} the PlaylistLoader or null
   */
  getLoader(mediaGroup) {
    for (let i = 0; i < this.mediaGroups_.length; i++) {
      let mgl = this.mediaGroups_[i];

      if (mgl.mediaGroup === mediaGroup) {
        return mgl.loader;
      }
    }
  }

  /**
   * add a PlaylistLoader given a mediaGroup, and a uri. for a combined track
   * we store null for the playlistloader
   *
   * @param {String} mediaGroup the mediaGroup to get the loader for
   * @param {String} uri the uri to get the audio track/mediaGroup from
   */
  addLoader(mediaGroup, uri = null) {
    let loader = null;

    if (uri) {
      // TODO: this should probably happen upstream in Master Playlist
      // Controller when we can switch PlaylistLoader sources
      // then we can just store the uri here instead
      loader = new PlaylistLoader(uri, this.hls, this.withCredentials);
    }
    this.mediaGroups_.push({mediaGroup, loader});
  }

  /**
   * remove a playlist loader from a track given the mediaGroup
   *
   * @param {String} mediaGroup the mediaGroup to remove
   */
  removeLoader(mediaGroup) {
    for (let i = 0; i < this.mediaGroups_.length; i++) {
      let mgl = this.mediaGroups_[i];

      if (mgl.mediaGroup === mediaGroup) {
        if (mgl.loader) {
          mgl.loader.dispose();
        }
        this.mediaGroups_.splice(i, 1);
        return;
      }
    }
  }

  /**
   * Dispose of this text track and the playlist loader that it holds inside
   */
  dispose() {
    let i = this.mediaGroups_.length;

    while (i--) {
      this.removeLoader(this.mediaGroups_[i].mediaGroup);
    }
  }

  /**
   * takes a webvtt file contents and parses it into cues
   *
   * @param {String} srcContent webVTT file contents
   *
   * @private
   */
  parseCues_(srcContent) {
    const parser = new window.WebVTT.Parser(window, window.vttjs, window.WebVTT.StringDecoder());
    const errors = [];

    parser.oncue = (cue) => {
      // Double check we don't already have this cue before we add it
      //(WebVTT streams are mandated to include cues in both segments should the cue span
      // a segment boundary)
      const cues = this.cues_;
      let i = cues.length;

      // Start from the back so that if it's recently been added we can exit early
      while (i-- > 0) {
        // If the content and timing is the same, it's the same:
        let otherCue = cues[i];
        if (otherCue.startTime === cue.startTime
         && otherCue.endTime === cue.endTime
         && otherCue.text === cue.text) { return; }
      }

      this.addCue(cue);
    };

    parser.onparsingerror = (error) => errors.push(error);

    parser.onflush = () => {
      this.trigger({
        type: 'loadeddata',
        target: this
      });
    };

    parser.parse(this.decoder_.decode(srcContent));
    if (errors.length > 0 && window.console) {
      if (window.console.groupCollapsed) {
        window.console.groupCollapsed(`Text Track parsing errors for ${this.uri}`);
      }
      errors.forEach((error) => console.error(error));
      if (window.console.groupEnd) {
        window.console.groupEnd();
      }
    }

    parser.flush();
  };
}
