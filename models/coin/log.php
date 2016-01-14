<?php
namespace coin;
/**
 *
 */
class log_model extends \TMS_MODEL {
	/**
	 *
	 * @param string $mpid
	 * @param string $act
	 * @param string $from payer
	 * @param string $openid payee
	 */
	public function record($mpid, $act, $objId, $from, $openid) {
		if (empty($mpid) || empty($act) || empty($openid) || empty($from)) {
			return false;
		}
		if ($rule = \TMS_APP::model('coin\rule')->byMpid($mpid, $act, $objId)) {
			if ((int) $rule->delta > 0) {
				$current = time();
				$fans = \TMS_APP::model('user/fans')->byOpenid($mpid, $openid, 'nickname,coin');
				$total = (int) $fans->coin + (int) $rule->delta;
				/*更新总值*/
				$this->update("update xxt_fans set coin=coin+$rule->delta where mpid='$mpid' and openid='$openid'");
				/*记录日志*/
				$i['mpid'] = $mpid;
				$i['occur_at'] = $current;
				$i['act'] = $act;
				$i['payer'] = $from;
				$i['payee'] = $openid;
				$i['nickname'] = $fans->nickname;
				$i['delta'] = $rule->delta;
				$i['total'] = $total;
				$this->insert('xxt_coin_log', $i, false);
			}
		}

		return true;
	}
}