<?php
namespace pl\fe\matter\mission;

require_once dirname(dirname(__FILE__)) . '/base.php';
/*
 * 项目控制器
 */
class page extends \pl\fe\matter\base {
	/**
	 * 创建频道定制页面
	 */
	public function create_action($site, $id, $page) {
		if (false === ($user = $this->accountUser())) {
			return new \ResponseTimeout();
		}

		$code = $this->model('code\page')->create($site, $user->id);

		$rst = $this->model()->update(
			'xxt_mission',
			[
				$page . '_page_name' => $code->name,
			],
			["id" => $id]
		);

		return new \ResponseData($code);
	}
	/**
	 * 创建频道定制页面
	 */
	public function update_action($site, $id, $page) {
		if (false === ($user = $this->accountUser())) {
			return new \ResponseTimeout();
		}

		$newPage = $this->getPostJson();

		$modelMis = $this->model('matter\mission');
		$mission = $modelMis->byId($id);
		$data = [
			'html' => isset($newPage->html) ? $newPage->html : '',
		];

		$modelCode = $this->model('code\page');
		$code = $modelCode->lastByName($site, $mission->{$page . '_page_name'});
		$code = $modelCode->modify($code->id, $data);

		return new \ResponseData($code);
	}
	/**
	 * 重置定制页面
	 *
	 * @param int $codeId
	 */
	public function reset_action($site, $id, $page) {
		if (false === ($user = $this->accountUser())) {
			return new \ResponseTimeout();
		}
		$modelMis = $this->model('matter\mission');
		$mission = $modelMis->byId($id);
		$data = array(
			'html' => '',
			'css' => '',
			'js' => '',
		);
		$modelCode = $this->model('code\page');
		$code = $modelCode->lastByName($site, $mission->{$page . '_page_name'});
		$rst = $modelCode->modify($code->id, $data);

		return new \ResponseData($rst);
	}
}